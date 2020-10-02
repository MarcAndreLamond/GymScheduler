import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import InputLabel from '@material-ui/core/InputLabel';
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import DateFnsUtils from '@date-io/date-fns';
import {
    MuiPickersUtilsProvider,
    KeyboardTimePicker
} from '@material-ui/pickers';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import { API } from 'aws-amplify';
import { listSchedules } from './graphql/queries';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import { createSchedule as createScheduleMutation, deleteSchedule as deleteScheduleMutaion } from './graphql/mutations';

const localizer = momentLocalizer(moment);
const useStylesBar = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
    },
}));


const useStylesButton = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(3),
        },
    },
}));

function rand() {
    return Math.round(Math.random() * 20) - 10;
}

function getModalStyle() {
    const top = 50 + rand();
    const left = 50 + rand();

    return {
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-${top}%, -${left}%)`,
    };
}

const useStyles = makeStyles((theme) => ({
    paper: {
        position: 'absolute',
        width: 400,
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
}));

function AdminApp() {

    const [myEventsList, setEventList] = React.useState([]);
    const classes = useStyles();
    const [openModal, setOpenModal] = React.useState(false);
    const [startDate, setStartDate] = React.useState(new Date('2014-08-18T21:11:54'));
    const [endDate, setEndDate] = React.useState(new Date('2014-08-18T21:11:54'));
    const [titreSchedule, setitreSchedule] = React.useState(null);
    const [modalStyle] = React.useState(getModalStyle);
    const [openModalReservation, setOpenModalReservation] = React.useState(false);
    const [Select, setSelect] = React.useState(null);

    useEffect(() => {
        fetchSchedule();
    }, []);


    async function fetchSchedule() {
        const apiData = await API.graphql({ query: listSchedules });
        const s = apiData.data.listSchedules.items.map(convertData);
        setEventList(s);
    }

    function convertData(item) {
        const s = moment(item.start).format("YYYY-MM-DDThh:mm:ss");
        const e = moment(item.end).format("YYYY-MM-DDThh:mm:ss");
        var data = {
            id: item.id,
            start: moment(s).toDate(),
            end: moment(e).toDate(),
            title: item.title,
            client: item.client,
            mail: item.mail,
            phone: item.phone,
            nbClient: item.nbClient,
            price: item.price,
        };
        return data;
    };

    const handleDateStartChange = (date) => {
        setStartDate(date);
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
    };

    const handleTitreChange = (titre) => {
        setitreSchedule(titre.target.value);
    };

    const handleOpen = ({ start, end }) => {
        start = moment(start).format("YYYY-MM-DDThh:mm:ss");
        end = moment(end).format("YYYY-MM-DDThh:mm:ss");
        setitreSchedule(null);
        setStartDate(start);
        setEndDate(end);
        setOpenModal(true);
    };
    const handleClose = () => {
        setOpenModal(false);
        setOpenModalReservation(false);
    };

    const handleOpenReservation = ({ start, end }) => {
        setStartDate(start);
        setEndDate(end);
        const newSchedule = myEventsList.find(ele => ele.start === start);
        setitreSchedule(newSchedule.title);
        setSelect(newSchedule);
        setOpenModal(true);
        setOpenModalReservation(true);
    };

    const AddEvent = () => {
        if (!titreSchedule) return;
        const start = moment(startDate).toDate();
        const end = moment(endDate).toDate();
        const title = titreSchedule;
        API.graphql({
            query: createScheduleMutation, variables: {
                input: {
                    start,
                    end,
                    title,
                }
            }
        });
        fetchSchedule();
        handleClose();
    }
    async function ModifyEvent() {
        if (!titreSchedule) return;
        await API.graphql({ query: deleteScheduleMutaion, variables: { input: { id: Select.id } } });
        const start = moment(startDate).toDate();
        const end = moment(endDate).toDate();
        const title = titreSchedule;
        await API.graphql({
            query: createScheduleMutation, variables: {
                input: {
                    start,
                    end,
                    title,
                    client: Select.client,
                    mail: Select.mail,
                    phone: Select.phone,
                    nbClient: Select.nbClient,
                    price: Select.price,
                }
            }
        });
        fetchSchedule();
        handleClose();
    }

    const RemoveEvent = () => {
        const newSchedule = myEventsList.filter(ele => ele.id !== Select.id);
        setEventList(newSchedule);
        API.graphql({ query: deleteScheduleMutaion, variables: { input: { id: Select.id } } });
        handleClose();
    }
    const infoClient = (
    Select !== null ? 
        <div margin="normal" justify="space-around">
            <InputLabel margin="normal" >Client - {Select.client} </InputLabel>
            <InputLabel margin="normal" >Email - {Select.mail} </InputLabel> 
            <InputLabel margin="normal">Phone - {Select.phone} </InputLabel>
            <InputLabel  margin="normal">Number of client - {Select.nbClient} </InputLabel>
            <InputLabel  margin="normal">Price - {Select.price} $</InputLabel> 
         </div>
    : null
    );

    const formBody = (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Grid container justify="space-around">
                <form Validate autoComplete="off">
                    <TextField margin="normal" id="titre" label="Titre" value={titreSchedule} onChange={handleTitreChange} required />
                    {Select !== null ? 
            (Select.client === null ? null : infoClient) : null }
                
                </form>
        

                <KeyboardTimePicker
                    margin="normal"
                    id="time-picker"
                    label="Time picker"
                    value={startDate}
                    onChange={handleDateStartChange}
                    KeyboardButtonProps={{
                        'aria-label': 'change start time',
                    }}
                />

                <KeyboardTimePicker
                    margin="normal"
                    id="time-picker"
                    label="Time picker"
                    value={endDate}
                    onChange={handleEndDateChange}
                    KeyboardButtonProps={{
                        'aria-label': 'change End time',
                    }}
                />
            </Grid>
        </MuiPickersUtilsProvider>
    );

    const body = (
        <div style={modalStyle} className={classes.paper} >

            <h2 id="simple-modal-title">Create event </h2>
            {formBody}

            <Grid paddingTop={2} container justify="space-around">
                <Button variant="contained" color="primary" onClick={AddEvent}>
                    Add event
            </Button>

            </Grid>
        </div>
    );

    const bodyReservation = (

        <div style={modalStyle} className={classes.paper} >
            <Grid paddingTop={2} container justify="space-around">
                <h2 id="simple-modal-title">Modify event </h2>
                {formBody}

                <Button variant="contained" color="primary" onClick={RemoveEvent}>
                    Delete
            </Button>
                <Button variant="contained" color="primary" onClick={ModifyEvent}>
                    Modify
            </Button>
            </Grid>
        </div>
    );

    const classesButton = useStylesButton();
    const classesBar = useStylesBar();

    return (
        <div>
            <div className={classesBar.root}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" className={classesBar.title}>
                            Admin Gym Test
                        </Typography>
                        <div>
                            <AmplifySignOut />
                        </div>
                    </Toolbar>
                </AppBar>
            </div>
            <div>
                <Calendar
                    selectable
                    localizer={localizer}
                    events={myEventsList}
                    defaultView={Views.WEEK}
                    onSelectEvent={handleOpenReservation}
                    onSelectSlot={handleOpen}
                />
                <Modal
                    open={openModal}
                    onClose={handleClose}
                    aria-describedby="simple-modal-description"
                >
                    {openModalReservation ? bodyReservation : body}
                </Modal>

            </div>
        </div>
    )
}

export default withAuthenticator(AdminApp);