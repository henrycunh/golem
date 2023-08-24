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
        function containsCodeBlock(text: string) {
            const codeBlockRegex = /^```[a-zA-Z]*([\s\S]*?)```$/gm
            return codeBlockRegex.test(text)
        }
        function removeKeywords(inputText: any) {
            const keywordsToRemove = ['python', 'javascript']
            let outputText = inputText

            for (const keyword of keywordsToRemove) {
                const regex = new RegExp(keyword, 'gi')
                outputText = outputText.replace(regex, '')
            }

            return outputText
        }
        function jsonToStringArray(jsonObject: any) {
            const jsonString = JSON.stringify(jsonObject)
            const stringArray = []

            for (const key in jsonObject) {
                if (jsonObject.hasOwnProperty(key)) {
                    const value = jsonObject[key]
                    stringArray.push(`${JSON.stringify(key)}: ${JSON.stringify(value)}`)
                }
            }

            return `[${stringArray.join(', ')}]`
        }
        function formatDataEntry(entry: any) {
            const [id, code, type, description, date, lieu, ville, latitude, longitude] = entry

            return `| ${id} | ${code} | ${type} | ${description} | ${date} | ${lieu} | ${ville} | ${latitude} | ${longitude} |`
        }
        /* function formatDataEntry(entry: any) {
            const [id, code, type, description, date, lieu, ville, latitude, longitude] = entry

            return `
    <tr>
      <td>${id}</td>
      <td>${code}</td>
      <td>${type}</td>
      <td>${description}</td>
      <td>${date}</td>
      <td>${lieu}</td>
      <td>${ville}</td>
      <td>${latitude}</td>
      <td>${longitude}</td>
    </tr>
  `
        }

        const tableHeader = `
  <thead class="thead-dark">
    <tr>
      <th>ID</th>
      <th>Code</th>
      <th>Type</th>
      <th>Description</th>
      <th>Date</th>
      <th>Lieu</th>
      <th>Ville</th>
      <th>Latitude</th>
      <th>Longitude</th>
    </tr>
  </thead>
` */
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

                    const apiResponseText = await response.text()
                    const cleanedApiResponse = apiResponseText.replace(/NaN/g, 'null')

                    deuxiemeApiResponse = JSON.parse(cleanedApiResponse)

                    logger.info(deuxiemeApiResponse)
                    logger.info(result.text)

                    if (Array.isArray(deuxiemeApiResponse) && deuxiemeApiResponse) {
                        deuxiemeApiResponse.forEach((element) => {
                            logger.info(element)
                        })
                        // const resultStringArray = jsonToStringArray(deuxiemeApiResponse)
                        const formattedDataArray = deuxiemeApiResponse.map(formatDataEntry)
                        // Joindre les chaînes formatées en une seule chaîne (peut-être séparée par une ligne vide)
                        const resultStringArray = formattedDataArray.join('\n\n')
                        /*
                        const tableBody = `
  <tbody>
    ${deuxiemeApiResponse.map(formatDataEntry).join('')}
  </tbody>
`

                        const resultStringArray = `
  <table>
    ${tableHeader}
    ${tableBody}
  </table>
` */
                        logger.info('TABLEAU CHAINEEEEEEEEEEEE  ', resultStringArray)
                        // let val = ' '

                        /* deuxiemeApiResponse.forEach((element) => {
                            val += element.join(' ')
                        }) */
                        result.text = resultStringArray
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
                    result.text = 'je suis incapable de recupérer vos données pour l\'instant, contactez l\'administrateur svp'
                }

                logger.info('RESULTAT TEXT', result.text)
            }
            if (options.choix === true && options.monchoixgraph !== '') {
                // logger.info('DEMANDE UN GRAPH SUR SES DONNEES', options.choix)
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
                    result.text = 'je suis incapable de recupérer vos données pour l\'instant, contactez l\'administrateur svp'
                }

                logger.info('RESULTAT TEXT', result.text)
            }
            if (containsCodeBlock(result.text) === true) {
                logger.info('DEMANDE UN GRAPH AVEC CODE SUR SES DONNEES AVEC REQUESTTTTTTTTTTTTTTTT YOUSSSSSSSSSSSSSSS', request)
                const inputString = result.text
                logger.info('DEMANDE UN GRAPH AVEC CODE SUR SES DONNEES AVEC REQUESTTTTTTTTTTTTTTTT YOUSSSSSSSSSSSSSSS', result.text)
                let codeContent
                let code
                const codeBlocks = inputString.match(/```([\s\S]*?)```/g)
                console.log(`LE CONTENU DU BLOC DE CODE${codeBlocks}`)
                if (codeBlocks) {
                    codeBlocks.forEach((block) => {
                        codeContent = block.replace(/^```([\s\S]*)```$/, '$1')
                        console.log(`LE CONTENU DU BLOC DE CODE${codeContent}`)
                    })

                    code = removeKeywords(codeContent)
                }
                let quatrièmeApiResponse
                try {
                    const response = await fetch('http://192.168.1.31:5343/programme_externe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            response: code,
                        }),
                    })

                    quatrièmeApiResponse = await response.json()
                    result.text = quatrièmeApiResponse.response
                    logger.info('QUATRIEME API RESPONSE ', quatrièmeApiResponse)
                    logger.info('CODE____________', code)
                }
                catch (error) {
                    logger.error('Erreur lors de l\'envoi à la quatrième API :', error)
                    result.text = 'je suis incapable de recupérer vos données pour l\'instant, contactez l\'administrateur svp'
                }
            }

            logger.info('RESULTAT TEXT', result.text)
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
