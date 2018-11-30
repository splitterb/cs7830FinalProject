/* Use jQuery to load firebase */
$.getScript('https://www.gstatic.com/firebasejs/5.5.9/firebase-app.js', function () {

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyC-2mdixMsvJVAnif9A1B_5T0LB7VJ0I90",
        authDomain: "cs7830-sign-in-app.firebaseapp.com",
        databaseURL: "https://cs7830-sign-in-app.firebaseio.com",
        projectId: "cs7830-sign-in-app",
        storageBucket: "cs7830-sign-in-app.appspot.com",
        messagingSenderId: "983749201634"
    };
    firebase.initializeApp(config);
});

/* Use jQuery to load firebase database */
$.getScript('https://www.gstatic.com/firebasejs/5.5.9/firebase-database.js');

angular.module('signInApp', ['ionic', 'ngSanitize'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs).
            // The reason we default this to hidden is that native apps don't usually show an accessory bar, at
            // least on iOS. It's a dead giveaway that an app is using a Web View. However, it's sometimes
            // useful especially with forms, though we would prefer giving the user a little more room
            // to interact with the app.
            if (window.cordova && window.Keyboard) {
                window.Keyboard.hideKeyboardAccessoryBar(true);
            }

            if (window.StatusBar) {
                // Set the statusbar to use the default style, tweak this to
                // remove the status bar on iOS or change it to use white instead of dark colors.
                StatusBar.styleDefault();
            }
        });
    })

    /* Start of controller for angular */
    .controller('signInCtrl', function ($scope) {

        $scope.fullName = "";
        $scope.code = "";
        $scope.date = "";
        $scope.success = false;
        $scope.resultText = "";
        $scope.listOfNames = [];

        $scope.userName = "";
        $scope.password = "";
        $scope.validAdmin = 0;

        $scope.desiredLatitude = 0;
        $scope.desiredLongitude = 0;
        $scope.desiredRadius = 0;

        $scope.clearList = function () {
            $scope.listOfNames = [];
        };
    
        //function to grab users location
        $scope.getLocation = function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition($scope.showPosition, $scope.showError);
            } else {
                $scope.resultText = "Geolocation is not supported by this browser.";
            }
            //            $scope.$apply();
        };

        //function to update the coordinates for where the class/meeting takes place
        $scope.updateCoordinates = function () {
            //specify path to take for reading data
            var ref = firebase.database().ref('/coordinates');

            ref.set({
                desiredLatitude: $scope.desiredLatitude,
                desiredLongitude: $scope.desiredLongitude,
                desiredRadius: $scope.desiredRadius
            });
        };

        //function to grab users position and if allowed by user, will show what that position is
        $scope.showPosition = function (position) {

            //specify path to take for reading data
            var ref = firebase.database().ref('/coordinates');

            ref.on('value', function (snapshot) {
                if ($scope.withinRadius(position.coords.latitude, position.coords.longitude, snapshot.val().desiredLatitude, snapshot.val().desiredLongitude, snapshot.val().desiredRadius)) {
                    var fullName = $scope.fullName;
                    var code = $scope.code;

                    //specify path to take for reading data
                    var ref = firebase.database().ref('/code_of_the_day');

                    ref.on('value', function (snapshot) {
                        if (code === snapshot.val()) {
                            if (fullName != "" && code != "") {
                                //show successful sign in
                                $scope.resultText = "You Successfully Signed In! </br></br>Your Coordinates Are:</br><b>Latitude:</b> " + position.coords.latitude + "</br><b>Longitude:</b> " + position.coords.longitude;

                                //call function to write user data
                                $scope.signInToMeeting(fullName, code);

                                $scope.fullName = "";
                                $scope.code = "";
                                $scope.$digest();
                            } else {
                                $scope.resultText = "Please enter your name and the given code!";
                                $scope.$digest();
                            }
                        } else {
                            $scope.resultText = "Entered code is incorrect!";
                            $scope.$digest();
                        }
                    }, function (errorObject) {
                        console.log("The read failed: " + errorObject.code);
                    });

                } else {
                    $scope.resultText = "You are too far away to sign-in to the meeting.";
                }

            });


        };

        //function to display error if any of the following conditions are met
        $scope.showError = function (error) {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    $scope.resultText = "User denied the request for Geolocation."
                    break;
                case error.POSITION_UNAVAILABLE:
                    $scope.resultText = "Location information is unavailable."
                    break;
                case error.TIMEOUT:
                    $scope.resultText = "The request to get user location timed out."
                    break;
                case error.UNKNOWN_ERROR:
                    $scope.resultText = "An unknown error occurred."
                    break;
            }
            //            $scope.$apply();
        };

        // function to test if the person is within a certain radius
        $scope.withinRadius = function (pointLatitude, pointLongitude, interestLatitude, interestLongitude, kms) {
            'use strict';
            let R = 6371;
            let deg2rad = (n) => {
                return (n * (Math.PI / 180))
            };

            let dLat = deg2rad(interestLatitude - pointLatitude);
            let dLon = deg2rad(interestLongitude - pointLongitude);

            let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(pointLatitude)) * Math.cos(deg2rad(interestLatitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            let c = 2 * Math.asin(Math.sqrt(a));
            let d = R * c;
            return (d <= kms);
        };

        //function to sign in to the meeting
        $scope.signInToMeeting = function (name, code) {
            var d = new Date();
            var date = d.getMonth() + 1 + "-" + d.getDate();

            //specify path to take for storing data
            var ref = firebase.database().ref('/' + date);

            var signInTime = d.getHours() + ":" + d.getMinutes();

            name = toTitleCase(name);

            var obj = {
                name: name,
                code: code,
                signInTime: signInTime
            }

            ref.push(obj);
        };

        //function to capitalize first letter of each word
        function toTitleCase(str) {
            return str.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }

        //function to allow someone to sign in to the meeting/class
        $scope.viewSignIn = function () {
            var date = $scope.date;

            //specify path to take for storing data
            var ref = firebase.database().ref('/' + date);

            ref.orderByChild("name").once('value', function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var childKey = childSnapshot.key;
                    var childData = childSnapshot.val();

                    $scope.$apply();
                    $scope.listOfNames.push({
                        name: childData.name
                    });

                });
            });
            $scope.date = "";
        };

        //function to create an admin
        //Note: function currently not accessible via webpage, can change function call on admin.html to allow access
        $scope.createAdmin = function () {
            //specify path to take for storing data
            var ref = firebase.database().ref('/qUh84Rijln');

            var obj = {
                userName: $scope.userName,
                password: $scope.password
            }

            ref.push(obj);
        };

        //Try to sign in the admin
        $scope.adminSignIn = function () {
            var userName = $scope.userName;
            var password = $scope.password;

            //specify path to take for reading data
            var ref = firebase.database().ref('/qUh84Rijln');

            ref.on('value', function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var childKey = childSnapshot.key;
                    var childData = childSnapshot.val();

                    if (userName === childData.userName) {
                        if (password === childData.password) {
                            $scope.validAdmin = 1;
                            $scope.$digest();
                        }
                    } else {
                        console.log(childData);
                        console.log(userName);
                        console.log(password);
                    }
                });
            });
        };

    });
