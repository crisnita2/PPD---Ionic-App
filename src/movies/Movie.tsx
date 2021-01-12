import React from 'react';
import {IonItem, IonLabel} from '@ionic/react';
import {MovieProps} from "./MovieProps";

interface MoviePropsExt extends MovieProps {
    onEdit: (_id?: string) => void;
}

const Movie: React.FC<MoviePropsExt> = ({_id, title, investment, releaseDate, hasSequel, onEdit}) => {
    return (
        <IonItem onClick={() => onEdit(_id)}>
            <IonLabel>{title}</IonLabel>
            <IonLabel>{investment}</IonLabel>
            <IonLabel>{releaseDate}</IonLabel>
            <IonLabel>{hasSequel.toString()}</IonLabel>
        </IonItem>
    );
};

export default Movie;