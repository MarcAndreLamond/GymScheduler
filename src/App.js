import React, { useState } from 'react';
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

const localizer = momentLocalizer(moment);

const titleText = "Disponibilité";

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

export default function App() {
    const [myEventsList, setEventList] = useState([{
        start: moment().toDate(),
        end: moment()
            .add(1, "hour")
            .toDate(),
        title: titleText,
    }

    ]);

    const classes = useStyles();
    const [openModal, setOpenModal] = React.useState(false);
    const [startDate, setStartDate] = React.useState(new Date('2014-08-18T21:11:54'));
    const [endDate, setEndDate] = React.useState(new Date('2014-08-18T21:11:54'));
    const [modalStyle] = React.useState(getModalStyle);
    const [openModalReservation, setOpenModalReservation] = React.useState(false);

    const handleDateStartChange = (date) => {
        setStartDate(date);
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
    };

    const handleOpen = ({ start, end }) => {
        start = moment(start).format("YYYY-MM-DDThh:mm:ss");
        end = moment(end).format("YYYY-MM-DDThh:mm:ss");
        setStartDate(start);
        setEndDate(end);
        setOpenModal(true);
    };
    const handleClose = () => {
        setOpenModal(false);
    };

    const handleOpenReservation = ({ start, end }) => {
        setStartDate(start);
        setEndDate(end);
        setOpenModalReservation(true);
    };
    const handleCloseReservation = () => {
        setOpenModalReservation(false);
    };

    const removeDispo = () => {
        const list = myEventsList.filter(time => time.start !== startDate && time.end !== endDate);
        setEventList(list);
        handleCloseReservation();
    }
    const AddEvent = () => {
        const start = moment(startDate).toDate();
        const end = moment(endDate).toDate();
        const title = titleText;
        setEventList([
            ...myEventsList,
            {
                start,
                end,
                title,
            },
        ],
        );
        handleClose();
    }

    const body = (
        <div style={modalStyle} className={classes.paper} >
            <h2 id="simple-modal-title">Add disponibility </h2>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container justify="space-around">
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

            <Grid paddingTop={2} container justify="space-around">
                <Button variant="contained" color="primary" onClick={AddEvent}>
                    Add disponibility
            </Button>
            </Grid>

        </div>
    );
    const classesButton = useStylesButton();

    const bodyReservation = (
        <div style={modalStyle} className={classes.paper} >
            <h2 id="simple-modal-title">Reserve a date </h2>
            <div>
                <form Validate autoComplete="off">
                    <TextField id="Name" label="Name" required />
                    <TextField id="Email" label="Email" required />
                </form>
            </div>
            <div className={classesButton.root}>
            <Button marginTop={10} variant="contained" color="primary" onClick={removeDispo}>
                Add reservation
            </Button>
            </div>
        </div>
    )

    const classesBar = useStylesBar();

    return (
        <div>
            <div className={classesBar.root}>
                <AppBar   position="static">
                    <Toolbar>
                        <IconButton edge="start" className={classesBar.menuButton} color="inherit" aria-label="menu">
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" className={classesBar.title}>
                            Gym Test
                    </Typography>
                        <Button color="inherit">Login</Button>
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
                    {body}
                </Modal>

                <Modal
                    open={openModalReservation}
                    onClose={handleCloseReservation}
                    aria-describedby="simple-modal-description"
                >
                    {bodyReservation}
                </Modal>
            </div>
        </div>
    )
}
