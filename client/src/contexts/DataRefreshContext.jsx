import React, { createContext, useState, useContext, useCallback } from 'react';

const DataRefreshContext = createContext();

export const useDataRefresh = () => {
    return useContext(DataRefreshContext);
};

export const DataRefreshProvider = ({ children }) => {
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);

    const value = { refreshKey, triggerRefresh };

    return (
        <DataRefreshContext.Provider value={value}>
            {children}
        </DataRefreshContext.Provider>
    );
};
