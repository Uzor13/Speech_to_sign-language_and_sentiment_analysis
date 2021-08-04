import Amplify, {Storage} from 'aws-amplify'
import awsconfig from '../../aws-exports'
import React, {useState} from 'react';
import VideoUpload from '../../assets/img/Video upload-pana.svg'

Amplify.configure(awsconfig)

const FileUpload = () => {

    const [error, setError] = useState('');
    const [progress, setProgress] = useState(undefined);

    const onChange = async e => {
        const file = e.target.files[0]
        try {
            await Storage.put(file.name, file, {
                progressCallback(progress) {
                    setProgress(`Uploaded: ${progress.loaded}/${progress.total}`)
                },
                ContentType: 'video/mp4'
            })
                .then(item => {
                    console.log(item)
                })
                .catch(err => {
                    setError(`Error message: ${err}`)
                })
        } catch (e) {
            setError(`Error uploading file: ${e}`)
        }
    }

    return (
        <div className='w-full py-4 h-full'>
            <h1 className='text-center text-3xl font-bold hover:text-indigo-700'>
                Add your Sign Language Video to the Database</h1>
            <div className='flex justify-around h-full items-center'>
                <div className='flex justify-center flex-col h-1/2 items-center'>
                    <label htmlFor="videos" className='text-2xl pb-6'>
                        Upload Sign language Videos
                    </label>
                    <input type="file"
                           id='videos'
                           onChange={onChange}/>
                    {progress && <p className='text-lg text-indigo-700 pt-6'>{progress}</p>}
                    {error && (
                        <p className='text-lg text-red-600 pt-6'>Error: {error}</p>
                    )}
                </div>
                <div className='w-1/2 h-full flex justify-end items-center'>
                    <img className='w-3/5 flex items-center justify-center'
                         src={VideoUpload} alt="Video upload illustration"/>
                </div>

            </div>
        </div>
    );
};

export default FileUpload;
