import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { selectBasketItems, selectBasketTotal } from '../redux/basketSlice'

import Header from '../components/Header'
import Button from '../components/Button'
import CheckoutProduct from '../components/CheckoutProduct'

import Currency from 'react-currency-formatter'
import { Stripe } from 'stripe'
import { fetchPostJSON } from '../utils/api-helpers'
import getStripe from '../utils/get-stripejs'

import { ChevronDownIcon } from '@heroicons/react/solid'

const style = {
  wrapper: `min-h-screen overflow-hidden bg-[#e7ecee]`,
  mainContainer: `max-w-5xl pb-24 mx-auto`,
  mainTitle: {
    container: `px-5`,
    bagTitle: `my-4 text-3xl font-SFProText-600 lg:text-4xl`,
    subtitle: `my-4`,
  },
  infoProductWrapper: `mx-5 md:mx-8`,
  infoPurchase: {
    wrapper: `max-w-3xl mx-auto my-12 mt-6`,
    divide: `divide-y divide-gray-30`,
    topContainer: `pb-4`,
    itemContainer: `flex justify-between`,
    estimatedTax: `flex flex-col gap-x-1 lg:flex-row`,
    enterZipCode: `flex items-end text-blue-500 cursor-pointer hover:underline`,
    bottomContainer: `flex justify-between pt-4 text-left font-SFProText-600`,
  },
  checkoutSection: {
    container: `space-y-4 my-14`,
    title: `text-xl font-SFProText-600`,
    cards: `flex flex-col gap-4 md:flex-row`,
    firstCard: {
      container: `flex flex-col items-center flex-1 order-2 p-8 py-12 text-center bg-gray-200 rounded-xl`,
      title: `flex flex-col mb-4 text-xl font-SFProText-600`,
      subtitle: `mt-2 max-w-[240px] text-[13px]`,
    },
    secondCard: {
      container: `flex flex-col items-center flex-1 p-8 py-12 space-y-8 bg-gray-200 rounded-xl md:order-2`,
      title: `flex flex-col mb-4 text-xl font-SFProText-600`,
    },
  },
}

const infoPurchase = style.infoPurchase
const checkoutSection = style.checkoutSection

const Checkout = () => {
  const items = useSelector(selectBasketItems)
  const basketTotal = useSelector(selectBasketTotal)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [groupedItemsInBasket, setGroupedItemsInBasket] = useState(
    {} as { [key: string]: Product[] }
  )

  /**
   * O método reduce() executa uma função reducer (fornecida por você)
   * para cada elemento do array, resultando num único valor de retorno.
   *
   * A função reducer recebe até quatro parâmetros:
   * Acumulador (acc)
   * Valor Atual (cur)
   * Index Atual (idx)
   * Array original (src)
   *
   * O valor de retorno da sua função reducer é atribuída ao acumulador.
   * O acumulador, com seu valor atualizado, é repassado para cada iteração
   * subsequente pelo array, que por fim, se tornará o valor resultante, único, final.
   * --------------
   * Se haver o mesmo item no array, ele "se junta" com ele mesmo
   * E esse valor é adicionado ao acumulador -> results
   *
   * Sintaxe
   * array.reduce(callback( acumulador, valorAtual[, index[, array]] )[, valorInicial]))
   *
   * developer.mozilla.org
   */
  useEffect(() => {
    const groupedItems = items.reduce((results, item) => {
      ;(results[item._id] = results[item._id] || []).push(item)
      return results
    }, {} as { [key: string]: Product[] })

    setGroupedItemsInBasket(groupedItems)
  }, [items])

  const createCheckoutSession = async () => {
    setLoading(true)

    const checkoutSession: Stripe.Checkout.Session = await fetchPostJSON(
      '/api/checkout_sessions',
      {
        items: items,
      }
    )

    // Internal Server Error
    if ((checkoutSession as any).statusCode === 500) {
      console.error((checkoutSession as any).message)
      return
    }

    // Redirect to checkout
    const stripe = await getStripe()
    const { error } = await stripe!.redirectToCheckout({
      // Make the id field from the Checkout Session creation API response
      // available to this file, so you can provide it as parameter here
      // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
      sessionId: checkoutSession.id,
    })

    // If `redirectToCheckout` fails due to a browser or network
    // error, display the localized error message to your customer
    // using `error.message`.
    console.warn(error.message)

    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Bag - Apple</title>
        <meta name="description" content="Generated by create next app" />
      </Head>
      <div className={style.wrapper}>
        <Header />
        <main className={style.mainContainer}>
          <div className={style.mainTitle.container}>
            <h1 className={style.mainTitle.bagTitle}>
              {items.length > 0 ? 'Review your bag.' : 'Your bag is empty.'}
            </h1>
            <p className={style.mainTitle.subtitle}>
              Free delivery and free returns.
            </p>
            {items.length === 0 && (
              <Button
                title="Continue Shopping"
                onClick={() => router.push('/')}
              />
            )}
          </div>
          {items.length > 0 && (
            <div className={style.infoProductWrapper}>
              {Object.entries(groupedItemsInBasket).map(([key, items]) => (
                <CheckoutProduct key={key} items={items} id={key} />
              ))}
              <div className={infoPurchase.wrapper}>
                <div className={infoPurchase.divide}>
                  <div className={infoPurchase.topContainer}>
                    <div className={infoPurchase.itemContainer}>
                      <p>Subtotal</p>
                      <p>
                        <Currency quantity={basketTotal} currency="USD" />
                      </p>
                    </div>
                    <div className={infoPurchase.itemContainer}>
                      <p>Shipping</p>
                      <p>FREE</p>
                    </div>
                    <div className={infoPurchase.itemContainer}>
                      <div className={infoPurchase.estimatedTax}>
                        Estimated tax for:{' '}
                        <p className={infoPurchase.enterZipCode}>
                          Enter zip code
                          <ChevronDownIcon className="w-6 h-6" />
                        </p>
                      </div>
                      <p>$ -</p>
                    </div>
                  </div>
                  <div className={infoPurchase.bottomContainer}>
                    <h4>Total</h4>
                    <h4>
                      <Currency quantity={basketTotal} currency="USD" />
                    </h4>
                  </div>
                </div>
                <div className={checkoutSection.container}>
                  <h4 className={checkoutSection.title}>
                    How would you like to check out?
                  </h4>
                  <div className={checkoutSection.cards}>
                    <div className={checkoutSection.firstCard.container}>
                      <h4 className={checkoutSection.firstCard.title}>
                        <span>Pay Monthly</span>
                        <span>with Apple Card</span>
                        <span>
                          $283.16/mo. at 0% APR<span className="-top-1">◊</span>
                        </span>
                      </h4>
                      <Button title="Check Out with Apple Card Monthly Installments" />
                      <p className={checkoutSection.firstCard.subtitle}>
                        $0.00 due today, which includes applicable full-price
                        items, down payments, shipping, and taxes.
                      </p>
                    </div>

                    <div className={checkoutSection.secondCard.container}>
                      <h4 className={checkoutSection.secondCard.title}>
                        Pay in full
                        <span>
                          <Currency quantity={basketTotal} currency="USD" />
                        </span>
                      </h4>

                      <Button
                        noIcon
                        loading={loading}
                        title="Check Out"
                        width="w-full"
                        onClick={createCheckoutSession}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export default Checkout
