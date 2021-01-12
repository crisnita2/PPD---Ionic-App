import axios from 'axios';
import {authConfig, baseUrl, getLogger, withLogs} from '../core';
import {MovieProps} from './MovieProps';
import { Plugins } from "@capacitor/core";
const { Storage } = Plugins;

const movieUrl = `http://${baseUrl}/api/movie`;

export const getMovies: (token: string) => Promise<MovieProps[]> = token => {
    var result = axios.get(movieUrl, authConfig(token))
    result.then(async result => {
        for (const movie of result.data) {
            await Storage.set({
                key: movie._id!,
                value: JSON.stringify({
                    _id: movie._id,
                    title: movie.title,
                    investment: movie.investment,
                    releaseDate: movie.releaseDate,
                    hasSequel: movie.hasSequel
                }),
            });
        }
    });
    return withLogs(result, 'getMovies');
}

export const createMovie: (token: string, movie: MovieProps) => Promise<MovieProps[]> = (token, movie) => {
    var result = axios.post(movieUrl, movie, authConfig(token))
    result.then(async result => {
        var movie = result.data;
        await Storage.set({
            key: movie._id!,
            value: JSON.stringify({
                _id: movie._id,
                title: movie.title,
                investment: movie.investment,
                releaseDate: movie.releaseDate,
                hasSequel: movie.hasSequel
            }),
        });
    });
    return withLogs(result, 'createMovie');
}

export const updateMovie: (token: string, movie: MovieProps) => Promise<MovieProps[]> = (token, movie) => {
    var result = axios.put(`${movieUrl}/${movie._id}`, movie, authConfig(token))
    result.then(async result => {
        var movie = result.data;
        await Storage.set({
            key: movie._id!,
            value: JSON.stringify({
                _id: movie._id,
                title: movie.title,
                investment: movie.investment,
                releaseDate: movie.releaseDate,
                hasSequel: movie.hasSequel
            }),
        });
    });
    return withLogs(result, 'updateMovie');
}

export const removeMovie: (token: string, movie: MovieProps) => Promise<MovieProps[]> = (token, movie) => {
    var result = axios.delete(`${movieUrl}/${movie._id}`, authConfig(token))
    result.then(async result => {
        await Storage.remove({key: movie._id!})
    })
    return withLogs(result, 'deleteMovie');
}

interface MessageData {
    type: string;
    payload: MovieProps;
}

const log = getLogger('ws');

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({type: 'authorization', payload: {token}}));
    };
    ws.onclose = () => {
        log('web socket onclose');
    };
    ws.onerror = error => {
        log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}
