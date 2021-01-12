import React, {useContext, useEffect, useState} from 'react';
import {RouteComponentProps} from 'react-router';
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonLabel,
    IonList, IonListHeader, IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import {add} from 'ionicons/icons';
import {getLogger} from '../core';
import {MovieContext} from "./MovieProvider";
import Movie from "./Movie";
import {AuthContext} from "../auth";
import {MovieProps} from "./MovieProps";

const log = getLogger('MovieList');

const offset = 20;

const MovieList: React.FC<RouteComponentProps> = ({history}) => {
    const {logout} = useContext(AuthContext);
    const {movies, fetching, fetchingError} = useContext(MovieContext);
    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState(false);
    const [visibleMovies, setVisibleMovies] = useState<MovieProps[] | undefined>([]);
    const [page, setPage] = useState(offset)

    useEffect(()=>{
        setPage(offset)
        fetchData();
    }, [movies]);

    function fetchData(){
        setVisibleMovies(movies?.slice(0, page))
        setPage(page + offset);
        if (movies && page > movies?.length) {
            setDisableInfiniteScroll(true);
            setPage(movies.length);
        }
        else {
            setDisableInfiniteScroll(false);
        }
    }

    async function getNextPage($event:CustomEvent<void>){
        fetchData();
        ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Movies</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching movies"/>
                {visibleMovies && (
                    <IonList>
                        <IonListHeader lines="inset">
                            <IonLabel>Title</IonLabel>
                            <IonLabel>Investment</IonLabel>
                            <IonLabel>Release Date</IonLabel>
                            <IonLabel>Has Sequel</IonLabel>
                        </IonListHeader>
                        {visibleMovies.map(({_id, title, investment, releaseDate, hasSequel}) =>
                            <Movie key={_id} _id={_id} title={title} investment={investment}
                                             releaseDate={releaseDate} hasSequel={hasSequel}
                                             onEdit={_id => history.push(`/movie/${_id}`)}/>
                        )}
                    </IonList>
                )}
                <IonInfiniteScroll threshold = "100px" disabled={disableInfiniteScroll}
                                   onIonInfinite = {(e:CustomEvent<void>)=>getNextPage(e)}>
                    <IonInfiniteScrollContent
                        loadingText="Loading more movies...">
                    </IonInfiniteScrollContent>
                </IonInfiniteScroll>
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch movies'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/movie')}>
                        <IonIcon icon={add}/>
                    </IonFabButton>
                </IonFab>
                <IonFab vertical="bottom" horizontal="start" slot="fixed">
                    <IonFabButton onClick={handleLogout}>
                        Logout
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );

    function handleLogout() {
        log("logout");
        logout?.();
    }
};

export default MovieList;