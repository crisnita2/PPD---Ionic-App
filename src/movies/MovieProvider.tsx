import React, {useCallback, useContext, useEffect, useReducer} from 'react';
import PropTypes from 'prop-types';
import {getLogger} from '../core';
import {createMovie, getMovies, newWebSocket, removeMovie, updateMovie} from './movieApi';
import {MovieProps} from "./MovieProps";
import {AuthContext} from "../auth";
import { Plugins } from "@capacitor/core";
const { Storage } = Plugins;

const log = getLogger('MovieProvider');

type SaveMovieFn = (movie: MovieProps) => Promise<any>;
type DeleteMovieFn = (movie: MovieProps) => Promise<any>;

export interface MoviesState {
    movies?: MovieProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    deleting: boolean,
    deletingError?: Error | null,
    saveMovie?: SaveMovieFn,
    deleteMovie?: DeleteMovieFn
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: MoviesState = {
    fetching: false,
    saving: false,
    deleting: false
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';
const DELETE_ITEM_STARTED = "DELETE_ITEM_STARTED";
const DELETE_ITEM_SUCCEEDED = "DELETE_ITEM_SUCCEEDED";
const DELETE_ITEM_FAILED = "DELETE_ITEM_FAILED";

const reducer: (state: MoviesState, action: ActionProps) => MoviesState =
    (state, {type, payload}) => {
        switch (type) {
            case FETCH_ITEMS_STARTED:
                return {...state, fetching: true, fetchingError: null};
            case FETCH_ITEMS_SUCCEEDED:
                return {...state, movies: payload.movies, fetching: false};
            case FETCH_ITEMS_FAILED:
                return {...state, movies: payload.movies, fetching: false};

            case SAVE_ITEM_STARTED:
                return {...state, savingError: null, saving: true};
            case SAVE_ITEM_SUCCEEDED:
                const movies = [...(state.movies || [])];
                const movie = payload.movie;
                const index = movies.findIndex(it => it._id === movie._id);
                if (index === -1) {
                    movies.splice(0, 0, movie);
                } else {
                    movies[index] = movie;
                }
                return {...state, movies, saving: false};
            case SAVE_ITEM_FAILED:
                return {...state, movies: payload.error, saving: false};

            case DELETE_ITEM_STARTED:
                return {...state, deletingError: null, deleting: true};
            case DELETE_ITEM_SUCCEEDED: {
                const movies = [...(state.movies || [])];
                const movie = payload.movie;
                const index = movies.findIndex((it) => it._id === movie._id);
                movies.splice(index, 1);
                return {...state, movies, deleting: false};
            }
            case DELETE_ITEM_FAILED:
                return {...state, deletingError: payload.error, deleting: false};
            default:
                return state;
        }
    };

export const MovieContext = React.createContext<MoviesState>(initialState);

interface MovieProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const MovieProvider: React.FC<MovieProviderProps> = ({children}) => {
    const {token} = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const {movies, fetching, fetchingError, saving, savingError, deleting, deletingError} = state;
    useEffect(getMoviesEffect, [token]);
    useEffect(wsEffect, [token]);
    const saveMovie = useCallback<SaveMovieFn>(saveMovieCallback, [token]);
    const deleteMovie = useCallback<DeleteMovieFn>(deleteMovieCallback, [token]);
    const value = {movies, fetching, fetchingError, saving, savingError, saveMovie, deleting, deletingError, deleteMovie};
    log('returns');
    return (
        <MovieContext.Provider value={value}>
            {children}
        </MovieContext.Provider>
    );

    function getMoviesEffect() {
        let canceled = false;
        fetchMovies();
        return () => {
            canceled = true;
        }

        async function fetchMovies() {
            let canceled = false;
            fetchMovies();
            return () => {
                canceled = true;
            }

            async function fetchMovies() {
                if (!token?.trim()) {
                    return;
                }
                try {
                    log('fetchMovies started');
                    dispatch({type: FETCH_ITEMS_STARTED});
                    const movies = await getMovies(token);
                    log('fetchMovies succeeded');
                    if (!canceled) {
                        dispatch({type: FETCH_ITEMS_SUCCEEDED, payload: {movies}});
                    }
                } catch (error) {

                    let storageKeys = Storage.keys();
                    const promisedMovies = await storageKeys.then(async function (storageKeys) {
                        const movieList = [];
                        for (let i = 0; i < storageKeys.keys.length; i++) {
                            // alert(storageKeys.keys[i])
                            if(storageKeys.keys[i] != 'token') {
                                const promisedMovie = await Storage.get({key: storageKeys.keys[i]});
                                // alert(promisedMovie.value)
                                if (promisedMovie.value != null) {
                                    var movie = JSON.parse(promisedMovie.value);
                                }
                                movieList.push(movie);
                            }
                        }
                        return movieList;
                    });

                    const movies = promisedMovies
                    dispatch({type: FETCH_ITEMS_FAILED, payload: {movies}});
                }
            }
        }
    }

    async function saveMovieCallback(movie: MovieProps) {
        try {
            log('saveMovie started');
            dispatch({type: SAVE_ITEM_STARTED});
            const savedMovie = await (movie._id ? updateMovie(token, movie) : createMovie(token, movie));
            log('saveMovie succeeded');
            dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {movie: savedMovie}});
        } catch (error) {
            log('saveMovie failed');
            dispatch({type: SAVE_ITEM_FAILED, payload: {error}});
        }
    }

    async function deleteMovieCallback(movie: MovieProps) {
        try {
            log("delete started");
            dispatch({type: DELETE_ITEM_STARTED});
            const deletedMovie = await removeMovie(token, movie);
            log("delete succeeded");
            console.log(deletedMovie);
            dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {movie: movie}});
        } catch (error) {
            log("delete failed");
            dispatch({type: DELETE_ITEM_FAILED, payload: {error}});
        }
    }

    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(token, message => {
                if (canceled) {
                    return;
                }
                const {type, payload: movie} = message;
                log(`ws message, movie ${type}`);
                if (type === 'created' || type === 'updated') {
                    dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {movie}});
                }
            });
        }
        return () => {
            log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        }
    }
};