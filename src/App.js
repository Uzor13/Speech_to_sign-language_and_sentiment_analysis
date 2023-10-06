import React, {useEffect, useState} from "react";
import styled from 'styled-components'

import './App.css';

//AWS Amplify components
import {Amplify} from "aws-amplify";
import awsExports from "./aws-exports";
import {AmplifyAuthContainer, AmplifyAuthenticator, AmplifySignUp} from '@aws-amplify/ui-react'
import {AmazonAIPredictionsProvider, Predictions} from '@aws-amplify/predictions';
import mic from "microphone-stream";
import {AuthState, onAuthUIStateChange} from '@aws-amplify/ui-components';

//Components
import Sentiment from "./components/pages/Sentiment";
import Header from "./components/Header/Header";
import Sign from "./components/pages/Sign";
import Home from "./components/pages/Home";
import FileUpload from "./components/pages/FileUploads";
import Footer from "./components/Footer/Footer";


//Router
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Input from "./components/Input";

//Styled Components
const Container = styled.section`
  height: 80vh;
  width: 95%;
  background: #F9F9FC;
  margin: auto;
`

Amplify.configure(awsExports);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function App() {

    const [authState, setAuthState] = useState();
    const [user, setUser] = useState();
    const [response, setResponse] = useState("Press 'Start recording' to begin your transcription. " +
        "Press Stop recording once you finish speaking.")

    useEffect(() => {
        return onAuthUIStateChange((nextAuthState, authData) => {
            setAuthState(nextAuthState);
            setUser(authData)
        });
    }, []);

    function AudioRecorder(props) {
        const [recording, setRecording] = useState(false);
        const [micStream, setMicStream] = useState();
        const [audioBuffer] = useState(
            (function() {
                let buffer = [];
                function add(raw) {
                    buffer = buffer.concat(...raw);
                    return buffer;
                }
                function newBuffer() {
                    console.log("resetting buffer");
                    buffer = [];
                }

                return {
                    reset: function() {
                        newBuffer();
                    },
                    addData: function(raw) {
                        return add(raw);
                    },
                    getData: function() {
                        return buffer;
                    }
                };
            })()
        );

        async function startRecording() {
            console.log('start recording');
            audioBuffer.reset();

            window.navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
                const startMic = new mic();

                startMic.setStream(stream);
                startMic.on('data', (chunk) => {
                    var raw = mic.toRaw(chunk);
                    if (raw == null) {
                        return;
                    }
                    audioBuffer.addData(raw);

                });

                setRecording(true);
                setMicStream(startMic);
            });
        }

        async function stopRecording() {
            console.log('stop recording');
            const { finishRecording } = props;

            micStream.stop();
            setMicStream(null);
            setRecording(false);

            const resultBuffer = audioBuffer.getData();

            if (typeof finishRecording === "function") {
                finishRecording(resultBuffer);
            }

        }

        return (
            <div className="audioRecorder">
                <div>
                    {recording && <button
                        onClick={stopRecording}
                        className='bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md mt-4 mb-4'
                    >
                        Stop recording
                    </button>}
                    {!recording && <button
                        onClick={startRecording}
                        className='bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded-md mt-4 mb-4'
                    >
                        Start recording
                    </button>}
                </div>
            </div>
        );
    }

    function convertFromBuffer(bytes) {
        setResponse('Converting text...');

        Predictions.convert({
            transcription: {
                source: {
                    bytes
                },
                // language: "en-US", // other options are "en-GB", "fr-FR", "fr-CA", "es-US"
            },
        }).then(({ transcription: { fullText } }) => setResponse(fullText))
            .catch(err => setResponse(JSON.stringify(err, null, 2)))
    }

    return authState === AuthState.SignedIn && user ? (

        <div className='w-full h-screen container'>
            <Router>
                <Header/>
                <Switch>
                    <Container className="px-9">
                        <Route path='/' exact>
                            <Home/>
                        </Route>
                        <Route path='/speech'>
                            <div className='flex flex-col items-center h-full w-full py-4'>
                                <h1 className='font-bold text-3xl text-gray-700'>Speech to Sign Language</h1>
                                <AudioRecorder finishRecording={convertFromBuffer}/>
                                <p className='font-medium text-lg text-gray-700'>{response}</p>
                                <Sign response={response}/>
                            </div>
                        </Route>
                        <Route path='/text'>
                            <div className='flex flex-col items-center h-full w-full py-4'>
                                <h1 className='font-bold text-3xl text-gray-700'>Text to Sign Language</h1>
                                <Input/>
                            </div>
                        </Route>
                        <Route path='/sentiment'>
                            <div className='flex flex-col items-center py-4'>
                                <h1 className='font-bold text-3xl text-gray-700'>Speech to Sentiment Analysis</h1>
                                <AudioRecorder finishRecording={convertFromBuffer}/>
                                <p className='font-medium text-lg text-gray-700'>{response}</p>
                                <Sentiment textFromSpeech={response}/>
                            </div>
                        </Route>
                        <Route path='/upload' component={FileUpload}/>
                    </Container>

                </Switch>
                <Footer/>
            </Router>
        </div>

    ) : <AmplifyAuthContainer>
        <AmplifyAuthenticator usernameAlias='email'>
            <AmplifySignUp/>
        </AmplifyAuthenticator>
    </AmplifyAuthContainer>

}

export default App
