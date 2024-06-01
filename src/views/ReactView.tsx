import { useContext } from "react";
import { AppContext } from "./ExampleView";

export const useApp = (): App | undefined => {
    return useContext(AppContext);
};

export const ReactView = () => {
    const { vault } = useApp();

    return <h4>{vault.getName()}</h4>;
};