const clientID = 'aaf0ee2f6a59405c942910e295c82997';
const redirectUri = 'http://localhost:3000';

let accessToken;

const Spotify = {

    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }

        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            //clear params to grab a new token when expired
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    },

    async search(term) {
        const accessToken = Spotify.getAccessToken();
        const headers = {
            headers: { Authorization: `Bearer ${accessToken}` }
        };
        try {
            const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, headers);
            if (response.ok) {
                const jsonResponse = await response.json();
                if (!jsonResponse.tracks) {
                    return [];
                } else {
                    return jsonResponse.tracks.items.map(track => ({
                        id: track.id,
                        name: track.name,
                        artist: track.artists[0].name,
                        album: track.album.name,
                        uri: track.uri
                    }));
                }
            }
            throw new Error('Request Failed!');
        } catch (error) {
            console.log(error);
        }
    },

    async savePlayList(name, trackUris) {
        if (!name || !trackUris.length) {
            return;
        }
        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        let userID;
        let playlistID;

  
        try {
            //request username
            const response = await fetch("https://api.spotify.com/v1/me", {headers:headers});
            if (response.ok) {
                let jsonResponse = await response.json();
                userID = jsonResponse.id;
                //make a empty playlist with the name we entered
                const createPlaylist = await fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({ name: name })
                });
                if (createPlaylist.ok) {
                    jsonResponse = await createPlaylist.json();
                    playlistID = jsonResponse.id;
                    //populate the playlist with the tracks we selected
                    const popPlaylist = await fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
                        headers: headers,
                        method: 'POST',
                        body: JSON.stringify({ uris: trackUris })
                    });
                    if (popPlaylist.ok) {
                        alert("Playlist Created Successfully");
                        return popPlaylist.id;
                    } else {
                        throw new Error("Failed to populate playlist");
                    }
                } else {
                    throw new Error("Oops! 2nd fetch failed (createPlaylist)");
                }
            } else {
                throw new Error("1st fetch failed (userID)");
            }
        } catch (error) {
            console.log(error);
        }
    }
};

export default Spotify;



       // return fetch("https://api.spotify.com/v1/me", { headers: headers }
        // ).then(response => response.json()
        // ).then(jsonResponse => {
        //     userID = jsonResponse.id;
        //     return fetch(`/v1/users/${userID}/playlists`, {
        //         headers: headers,
        //         method: 'POST',
        //         body: JSON.stringify({ name: name })
        //     }).then(response => response.json()
        //     ).then(jsonResponse => {
        //         const playlistID = jsonResponse.id;
        //         return fetch(`/v1/users/${userID}/playlists/${playlistID}/tracks`, {
        //             headers: headers,
        //             method: 'POST',
        //             body: JSON.stringify({ uris: trackUris })
        //         })
        //     })
        // })