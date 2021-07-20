// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
    track_id: undefined,
    player_id: undefined,
    race_id: undefined,
    track: undefined,
}

const updateStore = (newState) => {
    console.log("update store with new data", newState)
    store = Object.assign(store, newState)
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    onPageLoad()
    setupClickHandlers()
})

async function onPageLoad() {
    // fetch tracks and racer data and render cards accordingly
    try {
        getTracks()
            .then(tracks => {
                const html = renderTrackCards(tracks)
                renderAt('#tracks', html)
            })

        getRacers()
            .then((racers) => {
                const html = renderRacerCars(racers)
                renderAt('#racers', html)
            })
    } catch (error) {
        console.log("Problem getting tracks and racers ::", error.message)
        console.error(error)
    }
}

function setupClickHandlers() {
    document.addEventListener('click', function (event) {
        const {target} = event

        // Race track form field
        if (target.matches('.card_track')) {
            handleSelectTrack(target)
        }

        // Podracer form field
        if (target.matches('.card_racer')) {
            handleSelectPodRacer(target)
        }

        // Submit create race form
        if (target.matches('#submit-create-race')) {
            event.preventDefault()
            // start race
            handleCreateRace()
        }

        // Handle acceleration click
        if (target.matches('#gas-peddle')) {
            handleAccelerate(target)
        }

    }, false)
}

async function delay(ms) {
    try {
        return await new Promise(resolve => setTimeout(resolve, ms));
    } catch (error) {
        console.log("an error shouldn't be possible here")
        console.log(error)
    }
}

// ^ PROVIDED CODE ^ DO NOT REMOVE


// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {

    // TODO - Get player_id and track_id from the store
    const {player_id} = store
    const {track_id} = store

    // render starting UI
    renderAt('#race', renderRaceStartView(track_id))

    // const race = TODO - invoke the API call to create the race, then save the result
    const race = await createRace(player_id, track_id)
    const trackSorted = race.Track.segments.sort(function compareNumbers(a, b) {
        return a - b;
    })
    const trackSortedUnique = [...new Set(trackSorted)]
    updateStore({track: trackSortedUnique})

    console.log("handleCreateRace, race:", race)

    // TODO - update the store with the race id
    updateStore({race_id: race.ID})

    // The race has been created, now start the countdown
    // TODO - call the async function runCountdown
    await runCountdown()

    // TODO - call the async function startRace
    await startRace(race.ID)

    // TODO - call the async function runRace
    try {
        await runRace(race.ID)
    } catch (err) {
        console.error(err)
    }

}

function runRace(raceID) {
    return new Promise((resolve, reject) => {
        // TODO - use Javascript's built in setInterval method to get race info every 500ms
        const raceInterval = setInterval(() => {
            // TODO - if the race info status property is "in-progress", update the leaderboard by calling:

            getRace(raceID).then(res => {
                if (res.status === 'in-progress') {
                    renderAt('#leaderBoard', raceProgress(res.positions))
                    const progresses = getProgresses(res.positions)
                    renderAt('#progress', renderProgresses(progresses))
                } else if (res.status === 'finished') {
                    clearInterval(raceInterval) // to stop the interval from repeating
                    renderAt('#race', resultsView(res.positions)) // to render the results view
                    resolve(res) // resolve the promise
                }
            }).catch(err => {
                console.error(err)
                reject()
            })
        }, 500)
    })
    // remember to add error handling for the Promise
}

async function runCountdown() {
    try {
        // wait for the DOM to load
        await delay(1000)
        let countdown = 3

        return new Promise(resolve => {
            // TODO - use Javascript's built in setInterval method to count down once per second
            const timer = setInterval(() => {
                // run this DOM manipulation to decrement the countdown for the user
                document.getElementById('big-numbers').innerHTML = String(--countdown)

                // TODO - if the countdown is done, clear the interval, resolve the promise, and return
                if (countdown === 0) {
                    clearInterval(timer)
                    resolve()
                }
            }, 1000)

        })
    } catch (error) {
        console.log(error);
    }
}

function handleSelectPodRacer(target) {
    const selectedRacerId = target.id
    console.log("selected a pod", selectedRacerId)

    // remove class selected from all racer options
    const selected = document.querySelector('#racers .selected')
    if (selected) {
        selected.classList.remove('selected')
    }

    // add class selected to current target
    target.classList.add('selected')

    // TODO - save the selected racer to the store
    updateStore({player_id: selectedRacerId})
    toggleStartRaceButton()
}

function handleSelectTrack(target) {
    console.log("handleSelectTrack")
    const selectedTrackId = target.id
    console.log("selected a track", selectedTrackId)

    // remove class selected from all track options
    const selected = document.querySelector('#tracks .selected')
    if (selected) {
        selected.classList.remove('selected')
    }

    target.classList.add('selected')
    updateStore({track_id: selectedTrackId})
    console.log("handleSelectTrack")
    toggleStartRaceButton()
}

function handleAccelerate() {
    console.log("accelerate button clicked")
    // TODO - Invoke the API call to accelerate
    const {race_id} = store
    accelerate(race_id)
}

function getProgresses(positions) {
    const progresses = positions.map(position => {
        return {
            progress: Math.round((parseInt(position.segment) / 201).toFixed(2) * 100),
            racer: position.driver_name,
            id: position.id
        }
    })
    return progresses
}

function toggleStartRaceButton() {
    const submitButton = document.getElementById("submit-create-race")
    const { player_id, track_id } = store
    if (player_id && track_id) {
        submitButton.disabled = false;
    }
    else {
        submitButton.disabled = true;
    }
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
    if (!racers.length) {
        return ` <h4>Loading Racers...</4> `
    }
    const results = racers.map(renderRacerCard).join('')
    return ` <ul id="racers"> ${results} </ul>`
}

function renderRacerCard(racer) {
    const {id, driver_name, top_speed, acceleration, handling} = racer
    return ` <li class="card_racer" id="${id}" 
                 style="background-image: url('../assets/images/${driver_name}.png');background-size: cover">
                 <div class="card__overlay">
			<h3>${driver_name}</h3>
			<p>speed: ${top_speed}</p>
			<p>acceleration: ${acceleration}</p>
			<p>handling: ${handling}</p>
			</div>
		    </li> `
}

function renderTrackCards(tracks) {
    if (!tracks.length) {
        return ` <h4>Loading Tracks...</4> `
    }
    const results = tracks.map((track, index) => renderTrackCard(track, index)).join('')
    return ` <ul id="tracks">${results} </ul>`
}

function renderTrackCard(track, i) {
    const {id, name} = track
    return ` <li id=${id} class="card_track" style="background-image: url('../assets/images/${i + 1}.png');background-size: cover"
                >
                <div class="card__overlay"> <h3>${name}</h3></div>
  </li>`
}

function renderCountdown(count) {
    return ` <h2>Race Starts In...</h2> <p id="big-numbers">${count}</p> `
}

function renderRaceStartView(track) {
    return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
    positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)
    return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
    console.log("matches?")
    console.log("positions,", positions)
    console.log("me id,", store.player_id)
    let userPlayer = positions.find(e => e.id == store.player_id)
    userPlayer.driver_name += " (you)"

    positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
    let count = 1

    const results = positions.map(p => {
        return ` <tr> <td> <h3>${count++} - ${p.driver_name}</h3> </td> </tr> `
    })
    return ` <main> <h3>Leaderboard</h3> <section id="leaderBoard"> ${results} </section> <section id="progress">
        </section> </main> `
}


function renderAt(element, html) {
    const node = document.querySelector(element)
    node.innerHTML = html
}

// ^ Provided code ^ do not remove

function renderProgresses(progresses) {

    const progressBars = progresses.map(progress => {
        return `<span>${progress.racer}</span></p><div class='progressBar' style='width: ${progress.progress}%'></div>`
    }).join(" ")

    console.log(`<div id="progress"> ${progressBars} </div>`)
    return ` <div id="progress"> ${progressBars} </div> `
}


// API CALLS ------------------------------------------------
const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
    return {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': SERVER,
        },
    }
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints

function getTracks() {
    const tracks = fetch(`${SERVER}/api/tracks`)
        .then(res => res.json())
        .catch(err => console.log('Problem with fetching tracks::', err))
    return tracks
}

function getRacers() {
    const cars = fetch(`${SERVER}/api/cars`)
        .then(res => res.json())
        .catch(err => console.log('Problem with fetching cars::', err))
    return cars
}

function createRace(player_id, track_id) {
    // create new race with selected racer and track id combination
    // returns {ID: 8, Track: {id: 1, name: "Track 1",…}, PlayerID: 4,…}
    // !!! bug, stored race is available via races/id - 1, in this case /7
    player_id = parseInt(player_id)
    track_id = parseInt(track_id)
    const body = {player_id, track_id}

    return fetch(`${SERVER}/api/races`, {
        method: 'POST',
        ...defaultFetchOpts(),
        dataType: 'jsonp',
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
    id = id - 1 // bug in API!
    const race = fetch(`${SERVER}/api/races/${id}`)
        .then(res => res.json())
        .catch(err => console.log('Problem with fetching cars::', err))
    return race
}

function startRace(id) {
    id = id - 1 // bug in API!
    return fetch(`${SERVER}/api/races/${id}/start`, {
        method: 'POST',
        ...defaultFetchOpts(),
    })
        .then(res => res.json())
        .catch(err => console.log("Problem with getRace request::", err))
}

function accelerate(id) {
    id = id - 1 // bug in API!
    return fetch(`${SERVER}/api/races/${id}/accelerate`, {
        method: 'POST',
        ...defaultFetchOpts(),
    })
        .then(res => res.json())
        .catch(err => console.log("Problem with accelerate request::", err))
}
