import React, {useState} from 'react';
import Amplify, {Storage} from "aws-amplify";

import awsconfig from '../aws-exports'
import natural from "natural";

Amplify.configure(awsconfig)

const Input = () => {
    const [inputText, setInputText] = useState('');
    const [videoPath, setVideoPath] = useState(undefined);
    const [error, setError] = useState('');

    const tokenizer = new natural.WordTokenizer();

    const tokenizedResponse = tokenizer.tokenize(inputText)
    console.log(tokenizer.tokenize(inputText))


    const lowerWords = tokenizedResponse.map(word => {
        return word.toLowerCase()
    })

    const getVideo = async () => {

        try {
                Storage.get(`${lowerWords}.mp4`, {
                    download: false
                })
                    .then(item => {
                        setVideoPath(item)
                        console.log(videoPath)
                    })
                    .catch(e => setError(e))


        } catch (e) {
            setError(`Error: ${e}`)
        }
    }

    const onChange = e => {
        setInputText(e.target.value)
    }
    return (
        <div className='mt-8 w-1/2'>
            <input type="text" onChange={onChange}
                   className='border-2 border-gray-500 border-opacity-25 px-2
                   focus:ring-2 focus:ring-indigo-500 rounded-md h-11 w-2/3'
                   placeholder='Input text for video'/>
            <button onClick={getVideo} className='bg-indigo-500 text-white ml-6 px-2 py-1 rounded-md'>
                Get Video from Text
            </button>
            <p className="mt-4 mb-3">The sign language videos: Alphabet, Apple, Daily, Drink, Empty Head, Father, Girl, Must, None, Number
                (1 -10), Perfect, Pick on, Search, Three</p>
            {videoPath &&
            <video src={videoPath} type="video/mp4" className='h-48 w-full rounded-md mt-4' controls autoPlay/>
            }
            <div className='flex flex-col justify-center items-center'>
                <p>{error.message}</p>
            </div>

        </div>
    );
};

export default Input;
