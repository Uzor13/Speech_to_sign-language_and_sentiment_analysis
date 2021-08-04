import React, {useState} from 'react';
import styled from 'styled-components'
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";


const Card = styled.div`
  padding: 2rem;
  width: 40%;
  display: flex;
  flex-direction: column;
  height: auto;
  align-items: center;
`

function Sentiment({textFromSpeech}) {
    const [id] = useState('1');
    const [azure, setAzure] = useState([]);
    const [loading, setLoading] = useState(false);


    const getAzureSentiment = async (url = '', data = {}) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': 'dbb628ba06d146e087c1f8951c40d149'
            },
            body: JSON.stringify(data)
        })
        return await response.json()
    }


    const handleClick = () => {
        setLoading(true)
        getAzureSentiment('https://speech-sentiment.cognitiveservices.azure.com/text/analytics/v3.1/sentiment?opinionMining=true'
            , {documents: [{"id": id, text: textFromSpeech}]})
            .then(data => {
                setAzure(data.documents)
                console.log(data)
            }).catch(err => {
            console.log(err)
        }).finally(() => {
            setLoading(false)
        })
    }

    if (loading) {
        return(
            <div className='w-full flex flex-col items-center'>
                <Loader type="BallTriangle" color="#00BFFF" height={80} width={80} />
                <h1 className='mt-2'>Getting sentiment, please wait...</h1>
            </div>
        )
    }


    return (
        <div className="w-full h-full flex flex-col items-center mt-5">
            <div>
                <button
                    className='px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-gray-100 rounded-md ml-4'
                    onClick={handleClick}>
                    Get Sentiment
                </button>
            </div>
            <Card className='bg-blue-200 rounded-md shadow-md mt-8'>
                {azure && azure.map(data => (
                    <div key={data.id} className='text-xl text-gray-700'>
                        <h1>Sentiment Result:
                            <span className='font-bold capitalize'> {data.sentiment}</span>
                        </h1>
                        <h1>Positive Score: <span className='font-bold'> {data.confidenceScores.positive}</span></h1>
                        <h1>Negative Score:
                            <span  className='font-bold capitalize'> {data.confidenceScores.negative}</span>
                        </h1>
                        <h1>Neutral Score:
                            <span className='font-bold capitalize'> {data.confidenceScores.neutral}</span>
                        </h1>
                    </div>
                ))}
            </Card>

        </div>
    );
}

export default Sentiment;
