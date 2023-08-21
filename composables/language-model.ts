import { Configuration, OpenAIApi } from 'openai'
import type { NitroFetchOptions } from 'nitropack'
import { nanoid } from 'nanoid'
import { streamOpenAIResponse } from '~~/utils/fetch-sse'

export function useLanguageModel() {
    const { apiKey } = useSettings()

    async function complete(prompt: string, params?: LMCompleteParams) {
        const client = new OpenAIApi(new Configuration({
            apiKey: apiKey.value || '',
        }))

        const additionalParams = {
            temperature: params?.temperature || 0.8,
            max_tokens: params?.maxTokens || 256,
            stop: params?.stop,
        }

        const response = await client.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'system',
                content: params?.systemMessage || 'This is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.',
            }, {
                role: 'user',
                content: prompt,
            }],
            ...additionalParams,
        })

        return response.data.choices[0].message?.content
    }

    async function sendMessage(options: any) {
        const { idconversation, onProgress, signal, choix, monchoixgraph, monchoixintdata, ...requestBody } = options
        const CHAT_COMPLETION_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
        const responseApi = 'http://54.39.185.58:5012/question'
        logger.info(requestBody.messages)
        logger.info(requestBody.messages[requestBody.messages.length - 1].content)

        const lastMessageContent = requestBody.messages[requestBody.messages.length - 1].content
        // requestBody.messages[requestBody.messages.length - 1].content = `reformuler en anglais la question suivante : ${lastMessageContent}?`
        logger.info('LOGGGERRRER ', options.choix)
        logger.info('LOGGGERRRER ID CONVERSATION=>>>>>>>>>> ', idconversation)

        logger.info(requestBody.messages[requestBody.messages.length - 1].content)
        logger.info('CHOIX', options.choix)
        if (options.choix === true && options.monchoixintdata !== '') {
            logger.info('LOGGGERRRER VERIFICATION ITERROGATION DATA PERSO', options.monchoixintdata)
            requestBody.messages[requestBody.messages.length - 1].content = `reformuler en anglais la question suivante :${lastMessageContent}?`
        }
        const request = requestBody.messages[requestBody.messages.length - 1].content

        const requestOptions: NitroFetchOptions<typeof CHAT_COMPLETION_ENDPOINT> = {
            method: 'POST',
            body: requestBody,
            headers: {
                Authorization: `Bearer ${apiKey.value}`,
            },
        }

        if (requestBody.stream) {
            requestOptions.responseType = 'stream'
        }

        if (options.signal) {
            requestOptions.signal = signal
        }

        // TODO: Discover why this is hitting maximum recursion depth on type inference
        const { data: response, error } = await handle<any>(($fetch as any)(CHAT_COMPLETION_ENDPOINT, requestOptions))

        if (error) {
            const cause = (error as any)?.response?._data.error
                ? (error as any)?.response?._data
                : JSON.parse(
                    new TextDecoder().decode(
                        (await ((error as any)?.response?._data as ReadableStream)
                            .getReader()
                            .read()
                        ).value,
                    ),
                )
            throw new OpenAIError({ cause, message: 'Failed to send message' })
        }
        const result = {
            role: 'assistant',
            id: nanoid(),
            text: '',
            delta: undefined,
            detail: undefined,
            parentMessageId: '',
        }
        if (!requestBody.stream) {
            if (response.id) {
                result.id = response.id
            }
            const message = response.choices[0].message
            if (!message) {
                throw new Error('No message in response')
            }
            result.text = message.content
            if (message.role) {
                result.role = message.role
            }
            result.detail = response as any
            return result
        }
        else {
            for await (const data of streamOpenAIResponse(response)) {
                if (data.id) {
                    result.id = data.id
                    console.log(`ID DE MESSAGE =>>>> ${result.id}`)
                }
                if (data?.choices?.length) {
                    const delta = data.choices[0].delta
                    result.delta = delta.content
                    if (delta?.content) {
                        result.text += delta.content
                    }
                    result.detail = data
                    if (delta.role) {
                        result.role = delta.role
                    }
                }
                /* if (onProgress) {
                    await onProgress(result)
                } */
            }
            if (options.choix === true && options.monchoixintdata !== '') {
                logger.info('INTEROGER CES PROPRES DONNEES', options.choix)
                let deuxiemeApiResponse
                try {
                    const response = await fetch('http://54.39.185.58:5012/question', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            question_reformule: result.text,
                            discussion_id: idconversation,
                        }),
                    })

                    deuxiemeApiResponse = await response.json()

                    logger.info(deuxiemeApiResponse)
                    logger.info(result.text)

                    if (Array.isArray(deuxiemeApiResponse) && deuxiemeApiResponse) {
                        deuxiemeApiResponse.forEach((element) => {
                            logger.info(element)
                        })
                        let val = ' '

                        deuxiemeApiResponse.forEach((element) => {
                            val += element.join(' ')
                        })
                        result.text = val
                    }
                    else if (deuxiemeApiResponse.response) {
                        console.log('-----------------------', result.text)
                        let val2 = ' '
                        val2 += deuxiemeApiResponse.response
                        result.text = val2
                    }
                    else {
                        let val1 = ' '
                        val1 += deuxiemeApiResponse.join(' ')
                        result.text = val1
                    }
                    console.log('-----------------------', result.text)
                    logger.info(requestBody.messages)
                    logger.info('Réponse de la deuxième API :', deuxiemeApiResponse)
                }
                catch (error) {
                    logger.error('Erreur lors de l\'envoi à la deuxième API :', error)
                }

                logger.info('RESULTAT TEXT', result.text)
            }
            if (options.choix === true && options.monchoixgraph !== '') {
                //logger.info('DEMANDE UN GRAPH SUR SES DONNEES', options.choix)
                logger.info('DEMANDE UN GRAPH SUR SES DONNEES AVEC REQUESTTTTTTTTTTTTTTTT', request)
                let troisiemeApiResponse
                try {
                    const response = await fetch('http://54.39.185.58:5050/graphe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            question_reformule: request,
                            discussion_id: idconversation,
                        }),
                    })

                    troisiemeApiResponse = await response.json()

                    logger.info(troisiemeApiResponse)
                    logger.info(result.text)

                    if (Array.isArray(troisiemeApiResponse) && troisiemeApiResponse) {
                        troisiemeApiResponse.forEach((element) => {
                            logger.info(element)
                        })
                        let val = ' '

                        troisiemeApiResponse.forEach((element) => {
                            val += element.join(' ')
                        })
                        result.text = val
                    }
                    else if (troisiemeApiResponse.response) {
                        console.log('-----------------------', result.text)
                        let val2 = ' '
                        val2 += troisiemeApiResponse.response
                        result.text = val2
                    }
                    else {
                        let val1 = ' '
                        val1 += troisiemeApiResponse.join(' ')
                        result.text = val1
                    }
                    console.log('-----------------------', result.text)
                    logger.info(requestBody.messages)
                    logger.info('Réponse de la troisième API :', troisiemeApiResponse)
                }
                catch (error) {
                    logger.error('Erreur lors de l\'envoi à la troisième API :', error)
                }

                logger.info('RESULTAT TEXT', result.text)
            }
            return result
        }
    }

    const checkIfAPIKeyIsValid = async (newApiKey: string) => {
        const res = await $fetch<any>('https://api.openai.com/v1/engines', {
            headers: {
                Authorization: `Bearer ${newApiKey || apiKey.value}`,
            },
        })
        if (res.status === 401) {
            throw new Error('Invalid API key')
        }
    }

    return { complete, sendMessage, checkIfAPIKeyIsValid }
}

interface LMCompleteParams {
    temperature?: number
    maxTokens?: number
    stop?: string
    systemMessage?: string
}
