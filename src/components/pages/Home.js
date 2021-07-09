import React from 'react';
import styled from 'styled-components'
import SentimentImg from '../../assets/img/Sentiment analysis-amico.svg'

const CTA = styled.h1`
  font-size: 3rem;
  font-weight: 600;
`

const Span = styled(CTA)`
  color: #5E3AEE;
`

const Img = styled.img`
 transform: scaleX(-1);
`

const Home = () => {
    return (
        <div className='flex justify-center'>
                <div className='w-1/2 flex justify-center items-center'>
                    <CTA>
                        Development of a <br/>
                        <Span> Speech to Sign Language and Sentiment Analysis </Span>
                        System
                    </CTA>
                </div>
                <div className='w-1/2 h-full flex justify-end items-center'>
                    <Img className='w-4/5 flex items-center justify-center'
                         src={SentimentImg} alt="Sentiment analysis image"/>
                </div>
        </div>
    );
};

export default Home;
