import React, {useState} from 'react';
import natural from 'natural'

//AWS Config
import Amplify, {Storage} from 'aws-amplify'
import awsconfig from '../../aws-exports'

Amplify.configure(awsconfig)


const Sign = ({response}) => {

    const [videoPath, setVideoPath] = useState(undefined);
    const [videoPaths, setVideoPaths] = useState([]);
    const lowerWordsArray = ["alphabet", "apple", "daily", /* Add more words */];
    const [error, setError] = useState('');

    const tokenizer = new natural.WordTokenizer();

    const tokenizedResponse = tokenizer.tokenize(response)
    console.log(tokenizer.tokenize(response))


    const lowerWords = tokenizedResponse.map(word => {
        return word.toLowerCase()
    })


    const getVideo = async () => {
        try {
            const fetchedVideoPaths = [];
            const errors = [];

            await Promise.all(lowerWords.map(async (word) => {
                try {
                    const item = await Storage.get(`${word}.mp4`, { download: false });
                    fetchedVideoPaths.push(item);
                } catch (e) {
                    errors.push(e);
                }
            }));

            // Now you have an array of video paths and an array of errors
            // Now you have an array of video paths and an array of errors
            console.log('Video Paths:', fetchedVideoPaths);
            console.log('Errors:', errors);

            // Here, you can set or display the videos one after the other
            // For example, you could use a loop to process the video paths
            if (fetchedVideoPaths.length > 0) {
                setVideoPaths(fetchedVideoPaths);
            } else {
                setError('No videos found.');
            }
        } catch (e) {
            setError(`Error: ${e}`);
        }
    };


    return (
        <div className='flex justify-around w-full'>
            <div className='flex flex-col items-center w-1/2 mt-4'>
                <button onClick={getVideo}
                        className='mt-6 bg-indigo-500 text-white ml-6 px-2 py-2 rounded-md'
                >Get Video from Speech
                </button>
                <p className="mt-4 mb-3">The sign language videos: Alphabet, Apple, Daily, Drink, Empty Head, Father, Girl, Must, None, Number
                    (1 -10), Perfect, Pick on, Search, Three</p>
                {videoPaths.length > 0 && (
                    <div>
                        {videoPaths.map((videoPath, index) => (
                            <div key={index}>
                                <video src={videoPath} type="video/mp4" controls autoPlay />
                                <br />
                            </div>
                        ))}
                    </div>
                )}
                <p>{error}</p>
            </div>
        </div>
    );
};

export default Sign;
