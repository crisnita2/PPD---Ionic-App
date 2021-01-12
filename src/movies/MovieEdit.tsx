import React, { useContext, useEffect, useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
    IonLabel, IonCheckbox, IonDatetime, IonFabButton, IonFab
} from '@ionic/react';
import { getLogger } from '../core';
import { MovieContext } from './MovieProvider';
import { RouteComponentProps } from 'react-router';
import { MovieProps } from './MovieProps';
import moment from 'moment';

const log = getLogger('MovieEdit');

interface MovieEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const MovieEdit: React.FC<MovieEditProps> = ({ history, match }) => {
    const { movies, saving, savingError, saveMovie, deleteMovie } = useContext(MovieContext);
    const [title, setTitle] = useState('');
    const [investment, setInvestment] = useState(0);
    const [releaseDate, setReleaseDate] = useState('');
    const [hasSequel, setHasAwards] = useState(false);
    const [movie, setMovie] = useState<MovieProps>();
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const movie = movies?.find(it => it._id === routeId);
        setMovie(movie);
        if (movie) {
            setTitle(movie.title);
            setInvestment(movie.investment);
            setReleaseDate(movie.releaseDate);
            setHasAwards(movie.hasSequel);
        }
    }, [match.params.id, movies]);
    const handleSave = () => {
        const editedMovie = movie ? { ...movie, title, investment, releaseDate, hasSequel } : { title, investment, releaseDate, hasSequel };
        saveMovie && saveMovie(editedMovie).then(() => history.goBack());
    };

    const handleDelete = () => {
        const editedMovie = movie
            ? { ...movie, title, investment, releaseDate, hasSequel }
            : {title, investment, releaseDate, hasSequel };
        deleteMovie && deleteMovie(editedMovie).then(() => history.goBack());
    };
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            Save
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLabel>Movie title</IonLabel>
                <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')} />
                <IonLabel>Investment</IonLabel>
                <IonInput value={investment} onIonChange={e => setInvestment(Number(e.detail.value || 0))} />
                <IonLabel>Release Date</IonLabel>
                <IonDatetime displayFormat="DD.MM.YYYY" pickerFormat="DD.MM.YYYY" value={releaseDate} onBlur={e => setReleaseDate((moment(e.target.value).format('DD.MM.YYYY')) || '')}/>
                <IonCheckbox checked={hasSequel} onIonChange={e => setHasAwards(e.detail.checked)}/>
                <IonLabel>hasSequel</IonLabel>
                <IonFab vertical="bottom" horizontal="start" slot="fixed">
                    <IonFabButton onClick={handleDelete}>
                        delete
                    </IonFabButton>
                </IonFab>
                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save movie'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default MovieEdit;