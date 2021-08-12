import React from 'react';
import {Link} from "react-router-dom";

const NavItem = () => {
    return (
        <ul className='flex gap-4 items-center'>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/'>Home</Link>
            </li>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/speech'>Speech to Sign</Link>
            </li>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/text'>Text to Sign</Link>
            </li>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/sentiment'>Sentiment Analysis</Link>
            </li>
            <li className='hover:bg-indigo-50 px-3 py-1 transition duration-300 ease-out'>
                <Link to='/upload'>Video Upload</Link>
            </li>
            {/*<AmplifySignOut/>*/}
        </ul>
    );
};

export default NavItem;
