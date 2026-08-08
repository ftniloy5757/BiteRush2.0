import React, { Suspense } from 'react';
import AdminUsersPage from './AdminComponent';


const page = () => {
    return (
        <div>
            <Suspense>
<AdminUsersPage></AdminUsersPage>
            </Suspense>
        </div>
    );
};

export default page;