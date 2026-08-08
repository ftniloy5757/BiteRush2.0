import React, { Suspense } from 'react';
import MenuComponent from './MenuComponent';

const page = () => {
    return (
        <div>
            <Suspense>
<MenuComponent></MenuComponent>
            </Suspense>
        </div>
    );
};

export default page;