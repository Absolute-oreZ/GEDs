import { Outlet } from "react-router-dom"

const AuthLayout = () => {
    return (
        <div className="flex">
            <section className="flex flex-1 justify-center items-center">
                <Outlet />
            </section>

            <img
                src="/images/auth-bg.jpg"
                alt="logo"
                className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
            />
        </div>
    )
}

export default AuthLayout