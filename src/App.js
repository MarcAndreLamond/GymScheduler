import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
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
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TextField from '@material-ui/core/TextField';
import { API } from 'aws-amplify';
import { listSchedules } from './graphql/queries';
import { createSchedule as createScheduleMutation, deleteSchedule as deleteScheduleMutaion } from './graphql/mutations';
import Box from '@material-ui/core/Box';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'REGION' });

const localizer = momentLocalizer(moment);


function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}


TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const useStylesPanel = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
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
    const [modalStyle] = React.useState(getModalStyle);
    const [name, setname] = React.useState(null);
    const [email, setEmail] = React.useState(null);
    const [phone, setPhone] = React.useState(null);
    const [SelectId, setSelectId] = React.useState(null);
    const [tab, setTabvalue] = React.useState(0);

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

    const handleClose = () => {
        setOpenModal(false);
        setEmail(null);
        setname(null);
    };

    const handleOpenReservation = ({ start, end }) => {
        const element = myEventsList.find(ele => ele.start === start);
        if (element.title !== "Not Available") {
            setStartDate(start);
            setEndDate(end);
            setSelectId(element.id);
            setOpenModal(true);
        }
    };

    async function AddReservation(start, end, title) {
        await API.graphql({
            query: createScheduleMutation, variables: {
                input: {
                    start,
                    end,
                    title,
                }
            }
        });
    }

    async function removeDispo() {

        if (!name && (!email || !phone)) return;
        const element = myEventsList.find(ele => ele.id === SelectId);
        if (startDate < element.start && endDate > element.end) return;
        if (email) {
            await senEmail(email, name);
        }
        if (phone) {
            await sendSNS();
        }
        await API.graphql({ query: deleteScheduleMutaion, variables: { input: { id: SelectId } } });
        if (startDate === element.start && endDate === element.end) {
            await AddReservation(startDate, endDate, "Not Available");
        } else if (startDate === element.start) {
            await AddReservation(startDate, endDate, "Not Available");
            await AddReservation(endDate, element.end, element.title);
        } else if (endDate === element.end) {
            await AddReservation(element.start, startDate, element.title);
            await AddReservation(startDate, endDate, "Not Available");
        } else {
            await AddReservation(element.start, startDate, element.title);
            await AddReservation(startDate, endDate, "Not Available");
            await AddReservation(endDate, element.end, element.title);
        }
        fetchSchedule();
        handleClose();
    }

    async function sendSNS() {
        // Create publish parameters
        var params = {
            Message: 'rendez-vous le ...', /* required */
            PhoneNumber: '+1'+phone,
        };

        // Create promise and SNS service object
        var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

        // Handle promise's fulfilled/rejected states
        publishTextPromise.then(
            function (data) {
                console.log("MessageID is " + data.MessageId);
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                });
    }

    async function senEmail() {
        var params = {
            Destination: { /* required */
                ToAddresses: [
                    email,
                    /* more items */
                ]
            },
            Message: { /* required */
                Body: { /* required */
                    Html: {
                        Charset: "UTF-8",
                        Data: "HTML_FORMAT_BODY"
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "TEXT_FORMAT_BODY"
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'gym reservation of ' + name
                }
            },
            Source: 'marcovich_5@hotmail.com', /* required */
            ReplyToAddresses: [
                'marcovich_5@hotmail.com',
                /* more items */
            ],
        };

        // Create the promise and SES service object
        var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

        // Handle promise's fulfilled/rejected states
        sendPromise.then(
            function (data) {
                console.log(data.MessageId);
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                });
    }


    const classesButton = useStylesButton();


    const handleNameChange = (e) => {
        setname(e.target.value);
    };


    const handleEmailChange = (e) => {

        setEmail(e.target.value);
    };


    const handlePhoneChange = (e) => {
        setPhone(e.target.value);
    };

    const bodyReservation = (
        <div style={modalStyle} className={classes.paper} >
            <h2 id="simple-modal-title">Reserve a date </h2>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container justify="space-around">
                    <div>
                        <TextField id="Name" label="Name" onChange={handleNameChange} required />
                    </div>
                    <div>
                        <TextField id="Email" label="Email" onChange={handleEmailChange} required />
                    </div>
                    <div>
                        <TextField id="phone" label="phone" onChange={handlePhoneChange} required />
                    </div>
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
            <div className={classesButton.root}>
                <Button marginTop={10} variant="contained" color="primary" onClick={removeDispo}>
                    Add reservation
            </Button>
            </div>
        </div>
    );
    const classesPanel = useStylesPanel();

    const handleChangeTab = (event, newValue) => {
        setTabvalue(newValue);
    };


    return (
        <div className={classesPanel.root}>
            <AppBar position="static">
                <Tabs value={tab} onChange={handleChangeTab} justify="space-around">
                    <Tab label="Home" {...a11yProps(0)} />
                    <Tab label="Reservation" {...a11yProps(1)} />
                    <Tab label="Contact us" {...a11yProps(2)} />
                </Tabs>
            </AppBar>
            <TabPanel value={tab} index={0}>
                <Typography variant="h1" component="h2" gutterBottom>
                    Hello
                </Typography>
            </TabPanel>
            <TabPanel value={tab} index={1}>
                <div>

                    <Typography variant="h1" component="h2" gutterBottom>
                        Add reservation
                </Typography>


                    <Calendar
                        selectable
                        localizer={localizer}
                        events={myEventsList}
                        defaultView={Views.WEEK}
                        onSelectEvent={handleOpenReservation}
                    />
                    <Modal
                        open={openModal}
                        onClose={handleClose}
                        aria-describedby="simple-modal-description"
                    >
                        {bodyReservation}
                    </Modal>
                </div>
            </TabPanel>
            <TabPanel value={tab} index={2}>
                <Typography variant="h1" component="h2" gutterBottom>
                    To be add
                </Typography>
            </TabPanel>
        </div>
    )
}

export default App;

