import React from 'react';
import {Link} from "react-router-dom";
import {AmplifySignOut} from "@aws-amplify/ui-react";

const NavItem = () => {
    return (
        <ul className='flex gap-4 items-center'>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/'>Home</Link>
            </li>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/sign'>Sign Language</Link>
            </li>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/sentiment'>Sentiment Analysis</Link>
            </li>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/upload'>Sign Video Upload</Link>
            </li>
            {/*<AmplifySignOut/>*/}
        </ul>
    );
};

export default NavItem;
