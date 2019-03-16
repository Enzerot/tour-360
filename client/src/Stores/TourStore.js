import { extendObservable, action, observable, runInAction } from 'mobx';
import { TourService, TourEditService } from './../api';
import { Tour, EditTour, EditPlace } from './';
import { deepObserve } from 'mobx-utils';

export default class TourStore {
    constructor() {
        this.editingTourDisposer = null;

        extendObservable(this, {
            tours: observable.array([]),
            selectedTour: null,
            editingTour: null,
            editingPlace: null,
            sessionId: null,
            firstConnectionPlace: null,
            get designerIsOpened() {
                return this.editingTour != null
            },
            get hasTours() {
                return (this.tours || []).length > 0;
            },
            isDirty: false,
        });
    }

    getFromSession(sessionId) {
        return TourEditService.get(sessionId).then(action((resp) => {
            const { tour } = resp.data;
            this._updateEditingTour(sessionId, tour);

            return this.editingTour;
        }));
    }

    beginEditing(tourId) {
        return TourEditService.beginEditing(tourId).then(action((resp) => {
            const { tour, sessionId } = resp.data.result;
            this._updateEditingTour(sessionId, tour);
            return sessionId;
        }));
    }

    editPlace(placeId) {
        TourEditService.getPlace(this.sessionId, placeId).then(action((resp) => {
            const { place } = resp.data;
            this.editingPlace = new EditPlace(this, this.sessionId, place);
        }));
    }

    selectPlace(place) {
        if (this.firstConnectionPlace) {
            if (this.editingTour.hasConnection(this.firstConnectionPlace.id, place.id)) {
                this.firstConnectionPlace = null;
                return;
            }

            TourEditService.addConnection(this.sessionId, this.firstConnectionPlace.id, place.id).then(action((resp) => {
                const { tour } = resp.data;
                this.editingTour.updateFromJson(tour);
                this.firstConnectionPlace = null;
            }));
        } else {
            runInAction(() => this.firstConnectionPlace = place);
        }
    }

    deleteConnection(place1Id, place2Id) {
        TourEditService.deleteConnection(this.sessionId, place1Id, place2Id).then(action((resp) => {
            const { tour } = resp.data;
            this.editingTour.updateFromJson(tour);
        }));
    }

    saveEditingPlace(cancel = false) {
        TourEditService.updatePlace(this.sessionId, this.editingPlace.asJson).then(action((resp) => {
            const { place } = resp.data;
            this.editingTour.updatePlaceFromJson(place);

            if (cancel) {
                this.editingPlace = null;
            } else {
                this.editingPlace.updateFromJson(place);
            }
        }));
    }

    cancelEditing() {
        return TourEditService.cancelChanges(this.sessionId).then(action(() => {
            this.editingTour = null;
            this.editingPlace = null;
            this.isDirty = false;
            this.editingTourDisposer && this.editingTourDisposer();
        }))
    }

    saveEditing() {
        return TourEditService.saveChanges(this.sessionId).then(action((result) => {
            this.editingTour.updateFromJson(result.data.tour);
        }));
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
        return TourService.uploadCover(id, file).then(action((resp) => {
            const tour = this.tours.find(tour => tour.id === id);
            tour.updateFromJson(resp.data.tour);
            tour.refreshCover();
        }));
    });

    addPlace(place) {
        return TourEditService.addPlace(this.sessionId, place).then(action((resp) => {
            this.editingTour.updateFromJson(resp.data.tour);
        }));
    }

    removePlace(id) {
        return TourEditService.removePlace(this.sessionId, id).then(action((resp) => {
            this.editingTour.updateFromJson(resp.data.tour);
        }));
    }

    updateImageMap = action((file, width, height) => {
        return TourEditService.uploadMapImage(this.sessionId, file, width, height).then(action((resp) => {
            this.editingTour.updateFromJson(resp.data.tour);
            this.editingTour.refreshCover();
        }));
    })

    updateImage360(file, width, height) {
        return TourEditService.updateImage360(this.sessionId, this.editingPlace.id, file, width, height).then(action((resp) => {
            const place = resp.data.place;
            this.editingTour.updatePlaceFromJson(place);
            this.editingPlace && this.editingPlace.updateFromJson(place);
        }));
    }

    viewPlaceImage360(placeId) {
        window.open(`http://localhost:8081/index.html?sessionId=${this.sessionId}&placeId=${placeId}`);
    }

    _getById(id) {
        const tour = this.tours.find(t => t.id === id);
        return tour;
    }

    _deleteById = action((id) => {
        if (this.selectedTour && this.selectedTour.id === id) {
            this.selectedTour = null;
        }
        const tour = this._getById(id);
        this.tours.splice(this.tours.indexOf(tour), 1);
    });

    _updateEditingTour = action((sessionId, tour) => {
        this.editingTour = new EditTour(this, sessionId, tour);
        this.isDirty = false;

        this.editingTourDisposer = deepObserve(this.editingTour, (change, path, root) => {
            this.isDirty = true;
        });

        this.sessionId = sessionId;
    });
}
