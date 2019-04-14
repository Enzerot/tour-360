import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { observer } from 'mobx-react';
import {
    FormControlLabel,
    TextField,
    Button,
    Select,
    FormControl,
    MenuItem,
    InputLabel,
    Input,
    Checkbox,
} from '@material-ui/core';

const styles = theme => ({
    root: {
        flex: 1,
        padding: theme.spacing.unit * 2,
    }
});

const EditTourPanel = observer(class EditTourPanel extends React.Component {
    constructor(props) {
        super(props);

        this._handleNameChanged = this._handleNameChanged.bind(this);
        this._handleChangeImageMapClick = this._handleChangeImageMapClick.bind(this);
        this._handleStartPlaceChanged = this._handleStartPlaceChanged.bind(this);
        this._handleIsPublicChanged = this._handleIsPublicChanged.bind(this);
    }

    _handleNameChanged(e) {
        this.props.onNameChanged({ origin: this, name: e.target.value });
    }

    _handleChangeImageMapClick(e) {
        this.props.onChangeImageMapClick({ origin: this });
    }

    _handleStartPlaceChanged(e) {
        this.props.onStartPlaceChanged({ origin: this, startPlaceId: e.target.value });
    }

    _handleIsPublicChanged(e) {
        this.props.onIsPublicChanged({ origin: this, isPublic: e.target.checked });
    }

    render() {
        const { classes, tour } = this.props;
        // const places = tour.places || [];
        const { places = [], startPlaceId = "" } = tour;

        return (<div className={classes.root}>
            <TextField
                label="Tour Name"
                value={tour.name}
                onChange={this._handleNameChanged}
                margin="normal"
                fullWidth={true}
                autoFocus
            />
            <Button fullWidth variant="text" color="primary" className={classes.selectImage} onClick={this._handleChangeImageMapClick} >
                Change Map Image
            </Button>
            <FormControl variant="filled" fullWidth disabled={places.length === 0}>
                <InputLabel htmlFor="start-place-field">Start Place</InputLabel>
                <Select
                    variant="filled"
                    fullWidth
                    onChange={this._handleStartPlaceChanged}
                    input={<Input name="start-place-field" id="start-place-field" />}
                    value={startPlaceId}>
                    {places.map(place => <MenuItem key={place.id} value={place.id}>{place.name}</MenuItem>)}
                </Select>
            </FormControl>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={tour.isPublic}
                        onChange={this._handleIsPublicChanged}
                        value="isPublic"
                    />
                }
                label="Is Public Tour"
                title="Determines can unauthorized users see this tour"
            />
        </div>);
    }
});

EditTourPanel.propTypes = {
    classes: PropTypes.object.isRequired,
    tour: PropTypes.shape({
        name: PropTypes.string.isRequired,
        places: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        })),
    }).isRequired,
    startPlaceId: PropTypes.string,
    onNameChanged: PropTypes.func.isRequired,
    onChangeImageMapClick: PropTypes.func.isRequired,
    onStartPlaceChanged: PropTypes.func.isRequired,
    onIsPublicChanged: PropTypes.func.isRequired,
}

export default withStyles(styles)(EditTourPanel);
