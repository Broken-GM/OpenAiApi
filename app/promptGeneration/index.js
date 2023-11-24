import Lambda from "@carson.key/lambdawrapper"
import fetch from 'node-fetch'

const run = async (lambda) => {
    await lambda.getSecret({ secretName: "arn:aws:secretsmanager:us-west-2:864304056061:secret:OpenAI-zCVa1n" })

    let fetchResponse = {}
    const parsedBody = JSON.parse(lambda.event?.body)

    if (parsedBody?.prompt) {
        fetchResponse = await fetch(
            "https://api.openai.com/v1/chat/completions", 
            { 
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${lambda.secrets["arn:aws:secretsmanager:us-west-2:864304056061:secret:OpenAI-zCVa1n"].secretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "model": parsedBody?.model ? parsedBody.model : "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "user",
                            "content": parsedBody.prompt
                        }
                    ]
                }),
            }
        )

        const responseFetch = await fetchResponse.json()

        lambda.addToLog({ name: "ChatGPT Respponse", body: responseFetch })

        return lambda.success({ body: { response: responseFetch?.choices?.[0]?.message?.content }, message: "" })
    } else {
        return lambda.badRequestError({ body: {}, message: "Prompt is missing in the body" })
    }
}

export const lambdaHandler = async (event, context) => {
    const lambdaObject = new Lambda({ event, context, run })

    await lambdaObject.main()

    return lambdaObject.response
};