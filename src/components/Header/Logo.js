import React from 'react';
import {Link} from "react-router-dom";

const Logo = () => {
    return (
        <div className='w-1/4 text-2xl font-bold'>
            <Link to='/'>
               <h1>uzor.</h1>
            </Link>
        </div>
    );
};

export default Logo;
