import React, {useState} from 'react';
import {Predictions} from "@aws-amplify/predictions";
import styled from 'styled-components'


const Card = styled.div`
  padding: 2rem;
  width: 40%;
  display: flex;
  flex-direction: column;
  height: auto;
  align-items: center;
`

function Sentiment({textFromSpeech}) {
    const [response, setResponse] = useState("")
    const [sentimentResult, setSentimentResult] = useState([]);


    function interpretFromPredictions() {
        Predictions.interpret({
            text: {
                source: {
                    text: textFromSpeech,
                },
                type: "ALL"
            }
        }).then(result => setSentimentResult(JSON.stringify(result.textInterpretation.sentiment, null, 2)))
            .catch(err => setResponse(JSON.stringify(err, null, 2)))
    }
    const handleClear = () => {
        setSentimentResult([])
    }


    return (
        <div
            className="w-full h-full flex flex-col items-center mt-5">
            <Card className='shadow-md bg-indigo-200 rounded-md'>
                <div className='flex justify-around w-full'>
                    <button
                        className='px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-gray-100 rounded-md ml-4'
                        onClick={interpretFromPredictions}>
                        Get Sentiment
                    </button>
                    <button className='bg-red-500 p-2 rounded-md hover:bg-red-600 text-white' onClick={handleClear}>
                        Clear Result</button>
                </div>
                    <code>
                        <pre className='break-all text-gray-700'>{sentimentResult}</pre>
                    </code>
            </Card>

        </div >
    );
}

export default Sentiment;
