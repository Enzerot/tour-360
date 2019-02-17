import { extendObservable, action, observable } from 'mobx';
import { TourService, TourEditService } from './../api';
import Tour from './Tour';

export default class TourStore {
    constructor() {
        extendObservable(this, {
            tours: observable.array([]),
            selectedTour: null,
            editingTour: null,
            sessionId: null,
        });
    }

    editTour(tourId) {
        TourEditService.beginEditing(tourId).then(action((resp) => {
            this.editingTour = resp.data.result.tour;
            this.sessionId = resp.data.result.sessionId;
        }));
    }

    cancelEditing(sessionId) {
        TourEditService.cancelChanges(sessionId).then(action(() => {
            this.editingTour = null;
        }))
    }

    saveEditing(sessionId) {
        TourEditService.cancelChanges(sessionId).then(action(() => {
        }))
    }

    getById(id) {
        return TourService.getById(id).then((resp) => {
            return this.updateTourFromServer(resp.data.result);
        });
    }

    loadTours = action(() => {
        TourService.getAll().then(action((resp) => {
            (resp.data.result || []).map(tour => this.updateTourFromServer(tour));
        }));
    });

    updateTourFromServer = action((json) => {
        let tour = this.tours.find(tour => tour.id === json.id);
        if (!tour) {
            tour = new Tour(this, json.id);
            this.tours.push(tour);
        }

        tour.updateFromJson(json);

        return tour;
    });

    create(name, mapType) {
        return TourService.create(name, mapType).then(() => this.loadTours());
    }

    delete(id) {
        return TourService.deleteById(id).then(() => {
            this._deleteById(id);
        });
    }

    updateCover = action((id, file) => {
        return TourService.uploadCover(id, file).then(action(() => {
            const tour = this.tours.find(tour => tour.id === id);
            tour.refreshCover();
        }));
    });

    _getById(id) {
        const tour = this.tours.find(t => t.id === id);
        return tour;
    }

    _deleteById = action((id) => {
        const tour = this._getById(id);
        this.tours.splice(this.tours.indexOf(tour), 1);
    });
}
