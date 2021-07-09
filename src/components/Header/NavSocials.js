import React from 'react';

const NavSocials = () => {
    return (
        <div className='flex gap-4'>
            <a href='https://github.com/uzor13'>
                <i className='fab fa-github hover:text-indigo-600'/>
            </a>
            <a href='https://linkedin.com/in/uzochukwuprecious'>
                <i className='fab fa-linkedin hover:text-indigo-600'/>
            </a>
            <a href='https://uzor.codes'>
                <i className='fab fa-chrome hover:text-indigo-600'/>
            </a>
        </div>
    );
};

export default NavSocials;
