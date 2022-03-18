import React, {useState} from 'react';
import natural from 'natural'

//AWS Config
import Amplify, {Storage} from 'aws-amplify'
import awsconfig from '../../aws-exports'

Amplify.configure(awsconfig)


const Sign = ({response}) => {

    const [videoPath, setVideoPath] = useState(undefined);
    const [error, setError] = useState('');

    const tokenizer = new natural.WordTokenizer();

    const tokenizedResponse = tokenizer.tokenize(response)
    console.log(tokenizer.tokenize(response))


    const lowerWords = tokenizedResponse.map(word => {
        return word.toLowerCase()
    })


    const getVideo = async () => {


        try {
            await lowerWords.forEach(word => {
                Storage.get(`${word}.mp4`, {
                    download: false
                })
                    .then(item => {
                        setVideoPath(item)
                    })
                    .catch(e => setError(e))
            })


        } catch (e) {
            setError(`Error: ${e}`)
        }
    }


    return (
        <div className='flex justify-around w-full'>
            <div className='flex flex-col items-center w-1/2 mt-4'>
                <button onClick={getVideo}
                        className='mt-6 bg-indigo-500 text-white ml-6 px-2 py-2 rounded-md'
                >Get Video from Speech
                </button>
                <p className="mt-4 mb-3">The sign language videos: Alphabet, Apple, Daily, Drink, Empty Head, Father, Girl, Must, None, Number
                    (1 -10), Perfect, Pick on, Search, Three</p>
                {videoPath &&
                <video src={videoPath} type="video/mp4" controls autoPlay/>
                }
                <p>{error}</p>
            </div>
        </div>
    );
};

export default Sign;
