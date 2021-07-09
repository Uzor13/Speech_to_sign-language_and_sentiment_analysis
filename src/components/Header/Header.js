import React from 'react';
import Nav from "./Nav";
import Logo from "./Logo";

import styled from 'styled-components'
import NavSocials from "./NavSocials";

const HeaderContainer = styled.header`
  color: #656B8E;
`


const Header = () => {
    return (
        <HeaderContainer className='w-full h-20 flex px-9'>
            <nav className='flex w-full items-center justify-between text-lg'>
                <Logo/>
                <Nav/>
                <NavSocials/>
            </nav>
        </HeaderContainer>
    );
};

export default Header;
