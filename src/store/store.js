import create from "zustand";

const initialState = {
    id: null,
    fullnames: null,
    employmentStatus: null,
    skill: null,
    imageKey: {
        id: null,
        key: null,
        url: null
    }
}

export const useStore = create(set => ({
    about: initialState,
    setImageUrl: (url) => set(state => ({
        about: {
            ...state.about,
            imageKey: {
                ...state.about.imageKey,
                url
            }
        }
    })),
    setId: (id) => set(state => ({
        about: {
            ...state.about,
            id,
        }
    })),
    setImageKey: (id, key) => set(state => ({
        about: {
            ...state.about,
            imageKey: {
                id,
                key
            }
        }
    })),
    updateAbout: (data) => set(state => ({ 
        about: data
    }))
}));
