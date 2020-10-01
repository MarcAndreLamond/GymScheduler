import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
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
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
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

function App() {

    const [myEventsList, setEventList] = React.useState([]);
    const classes = useStyles();
    const [openModal, setOpenModal] = React.useState(false);
    const [startDate, setStartDate] = React.useState(new Date('2014-08-18T21:11:54'));
    const [endDate, setEndDate] = React.useState(new Date('2014-08-18T21:11:54'));
    const [titreSchedule, setitreSchedule] = React.useState(null);
    const [modalStyle] = React.useState(getModalStyle);
    const [openModalReservation, setOpenModalReservation] = React.useState(false);
    const [SelectId, setSelectId] = React.useState(null);

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
        setSelectId(newSchedule.id);
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
        const newSchedule = myEventsList.filter(ele => ele.id !== SelectId);
        await API.graphql({ query: deleteScheduleMutaion, variables: { input: { id: SelectId } } });
        const start = moment(startDate).toDate();
        const end = moment(endDate).toDate();
        const title = titreSchedule;
        await API.graphql({
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

    const RemoveEvent = () => {
        const newSchedule = myEventsList.filter(ele => ele.id !== SelectId);
        setEventList(newSchedule);
        API.graphql({ query: deleteScheduleMutaion, variables: { input: { id: SelectId } } });
        handleClose();
    }

    const formBody = (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Grid container justify="space-around">
                <form Validate autoComplete="off">
                    <TextField id="titre" label="Titre" value={titreSchedule} onChange={handleTitreChange} required />
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

    // const bodyReservation = (
    //     <div style={modalStyle} className={classes.paper} >
    //         <h2 id="simple-modal-title">Reserve a date </h2>
    //         <div>
    //             <form Validate autoComplete="off">
    //                 <TextField id="Name" label="Name" required />
    //                 <TextField id="Email" label="Email" required />
    //             </form>
    //         </div>
    //         <div className={classesButton.root}>
    //             <Button marginTop={10} variant="contained" color="primary" onClick={removeDispo}>
    //                 Add reservation
    //         </Button>
    //         </div>
    //     </div>
    // )

    const classesBar = useStylesBar();

    return (
        <div>
            <div className={classesBar.root}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton edge="start" className={classesBar.menuButton} color="inherit" aria-label="menu">
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" className={classesBar.title}>
                            Gym Test
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
                {/* 
                <Modal
                    open={openModalReservation}
                    onClose={handleCloseReservation}
                    aria-describedby="simple-modal-description"
                >
                    {bodyReservation}
                </Modal> */}
            </div>
        </div>
    )
}

export default App;



// export default withAuthenticator(App);
