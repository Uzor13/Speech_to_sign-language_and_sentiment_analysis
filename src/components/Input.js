import React, {useState} from 'react';
import Amplify, {Storage} from "aws-amplify";

import awsconfig from '../aws-exports'

Amplify.configure(awsconfig)

const Input = () => {
    const [inputText, setInputText] = useState('');
    const [videoPath, setVideoPath] = useState(undefined);
    const [error, setError] = useState('');

    const getVideo = async () => {

        try {
            await Storage.get(`${inputText}.mp4`, {
                download: false
            })
                .then(item => {
                    setVideoPath(item)
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
            <div className='flex flex-col justify-center items-center'>
                {videoPath &&
                <video src={videoPath} type="video/mp4" className='h-48 w-56 rounded-md mt-4' controls autoPlay/>
                }
                <p>{error}</p>
            </div>

        </div>
    );
};

export default Input;
