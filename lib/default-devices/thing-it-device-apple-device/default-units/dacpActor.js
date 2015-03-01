module.exports = {
	metadata : {
		plugin : "dacpActor",
		label : "Default Actor for Apple DAAP/DACP Device",
		role : "actor",
		family : "dacpActor",
		deviceTypes : [ "apple-device/appleDevice" ],
		state : [],
		configuration : [],
		services : [ {
			id : "play",
			label : "Play"
		}, {
			id : "pause",
			label : "Pause"
		} ]
	},
	create : function() {
		return new DacpActor();
	}
};

var fs = require('fs');
var q = require('q');
var request = require('request');
var urlModule = require('url');

/**
 * Based on the work of https://github.com/j-muller/node-daap
 */
function DacpActor() {
	this.host = '127.0.0.1';
	this.port = 3689;
	this.pairingCode = null;

	// Mandatory header to control iTunes */
	this.headers = {
		'Viewer-Only-Client' : '1'
	};

	/**
	 * 
	 */
	DacpActor.prototype.start = function() {
		var deferred = q.defer();

		this.state = {};

		var self = this;

		this
				.startActor()
				.then(
						function() {
							if (!self.isSimulated()) {
								try {
									self.host = self.device.configuration.host;
									self.port = self.device.configuration.port;
									self.pairingCode = self.device.configuration.pairingCode;
								} catch (x) {
									self.device.node
											.publishMessage("Cannot initialize "
													+ self.device.id
													+ "/"
													+ self.id + ":" + x);
								}
							}

							deferred.resolve();
						}).fail(function(error) {
					deferred.reject(error);
				});

		return deferred.promise;
	};

	/*
	 * 
	 */
	DacpActor.prototype.apiUrl = function() {
		return 'http://' + this.host + ':' + this.port + '/';
	};

	DacpActor.prototype.sendRequest = function(url, options) {
		var deferred = q.defer();
		var self = this;

		console.log("====>");
		console.log("URL: " + url);

		options = {
			parse : (typeof (options) == 'object' && options.parse != undefined) ? options.parse
					: true
		};

		request.get({
			'url' : url,
			'headers' : this.headers,
			encoding : null
		}, function(error, response, body) {
			if (error) {
				if (response.statusCode == 503)
					callback('Be sure your pairing code is correct.');
				else
					callback(error);
			} else {
				console.log("<====");
				console.log(body);

				try {
					if (options.parse === true)
						body = self.parse(body);

					deferred.resolve(body);
				} catch (error) {
					console.trace(error);

					deferred.reject(error);
				}
			}
		});

		return deferred.promise;
	};

	DacpActor.prototype.serverInfo = function(callback) {
		return this.requestProxyCallback(this.apiUrl() + 'server-info',
				callback);
	};

	DacpActor.prototype.login = function(callback) {
		var url = this.apiUrl() + 'login?pairing-guid=' + this.pairingCode;

		return this.sendRequest(url);
	};

	DacpActor.prototype.databases = function(sessionId, callback) {
		var url = this.apiUrl() + 'databases?session-id=' + sessionId;

		return this.sendRequest(url);
	},

	DacpActor.prototype.containers = function(sessionId, databaseId, callback) {
		var url = this.apiUrl() + 'databases/' + databaseId
				+ '/containers?session-id=' + sessionId;

		return this.sendRequest(url);
	};

	DacpActor.prototype.items = function(sessionId, databaseId, containerId,
			callback, meta) {
		meta = (meta == null) ? 'dmap.itemname,dmap.itemid,this.songartist,this.songalbumartist,'
				+ 'this.songalbum,this.songtime,this.songartistid'
				: meta.join();

		var url = this.apiUrl() + 'databases/' + databaseId + '/containers/'
				+ containerId + '/items?session-id=' + sessionId + '&meta='
				+ meta;

		return this.sendRequest(url);
	};

	DacpActor.prototype.play = function(sessionId, songId, callback) {
		var uri = urlModule.parse(this.apiUrl() + 'ctrl-int/1/playqueue-edit?'
				+ 'command=add&query=\'dmap.itemid:' + songId + '\''
				+ '&sort=name&mode=1&session-id=' + sessionId);

		/* Decode URI path... Wtf DACP protocol !? */
		uri.path = decodeURIComponent(uri.path);

		return this.sendRequest(uri);
	};

	DacpActor.prototype.setProperty = function(sessionId, properties, callback) {
		var parameters = '';

		for ( var key in properties) {
			parameters += key + '=' + properties[key] + '&';
		}

		var uri = this.apiUrl() + 'ctrl-int/1/setproperty?' + parameters
				+ 'session-id=' + sessionId;

		return this.sendRequest(uri);
	};

	DacpActor.prototype.getProperty = function(sessionId, properties, callback) {
		var uri = this.apiUrl() + 'ctrl-int/1/getproperty?properties='
				+ properties.join() + '&session-id=' + sessionId;

		return this.sendRequest(uri);
	};

	DacpActor.prototype.artwork = function(sessionId, databaseId, itemId,
			callback, options) {
		options = (options == null) ? {} : options;
		options.width = options.width || 200;
		options.height = options.height || 200;
		var uri = this.apiUrl() + 'databases/' + databaseId + '/items/'
				+ itemId + '/extra_data/artwork?mw=' + options.width + '&mh='
				+ options.height + '&session-id=' + sessionId;

		return this.sendRequest(uri, {
			'parse' : false
		});
	};

	DacpActor.prototype.pause = function(sessionId, callback) {
		var uri = this.apiUrl() + 'ctrl-int/1/pause?session-id=' + sessionId;

		return this.sendRequest(uri);
	};

	DacpActor.prototype.playPause = function(sessionId, callback) {
		var uri = this.apiUrl() + 'ctrl-int/1/playpause?session-id='
				+ sessionId;

		return this.sendRequest(uri);
	},

	DacpActor.prototype.playStatusUpdate = function(sessionId, callback) {
		var uri = this.apiUrl() + 'ctrl-int/1/playstatusupdate?session-id='
				+ sessionId;

		return this.sendRequest(uri);
	};

	DacpActor.prototype.groups = function(sessionId, databaseId, callback) {
		var uri = this.apiUrl()
				+ 'databases/'
				+ databaseId
				+ '/groups?'
				+ 'meta=dmap.itemname,dmap.itemid,dmap.persistentid,this.songartist,this.groupalbumcount,this.songartistid&type=music&group-type=artists&sort=album&include-sort-headers=1&query=(\'this.songartist!:\'+(\'com.apple.itunes.extended-media-kind:1\',\'com.apple.itunes.extended-media-kind:32\'))'
				+ '&session-id=' + sessionId;

		return this.sendRequest(uri);
	};

	this.fieldTypes = {
		DMAP_UNKNOWN : 0,
		DMAP_UINT : 1,
		DMAP_INT : 2,
		DMAP_STR : 3,
		DMAP_DATA : 4,
		DMAP_DATE : 5,
		DMAP_VERS : 6,
		DMAP_DICT : 7
	};

	this.dmapTypes = [ {
		"code" : "abal",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.browsealbumlisting"
	}, {
		"code" : "abar",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.browseartistlisting"
	}, {
		"code" : "abcp",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.browsecomposerlisting"
	}, {
		"code" : "abgn",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.browsegenrelisting"
	}, {
		"code" : "abpl",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.baseplaylist"
	}, {
		"code" : "abro",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.databasebrowse"
	}, {
		"code" : "adbs",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.databasesongs"
	}, {
		"code" : "aeAD",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "com.apple.itunes.adam-ids-array"
	}, {
		"code" : "aeAI",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.itms-artistid"
	}, {
		"code" : "aeCD",
		"type" : this.fieldTypes.DMAP_DATA,
		"name" : "com.apple.itunes.flat-chapter-data"
	}, {
		"code" : "aeCF",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.cloud-flavor-id"
	}, {
		"code" : "aeCI",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.itms-composerid"
	}, {
		"code" : "aeCK",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.cloud-library-kind"
	}, {
		"code" : "aeCM",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.cloud-status"
	}, {
		"code" : "aeCR",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.content-rating"
	}, {
		"code" : "aeCS",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.artworkchecksum"
	}, {
		"code" : "aeCU",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.cloud-user-id"
	}, {
		"code" : "aeCd",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.cloud-id"
	}, {
		"code" : "aeDP",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.drm-platform-id"
	}, {
		"code" : "aeDR",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.drm-user-id"
	}, {
		"code" : "aeDV",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.drm-versions"
	}, {
		"code" : "aeEN",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.episode-num-str"
	}, {
		"code" : "aeES",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.episode-sort"
	}, {
		"code" : "aeGD",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.gapless-enc-dr"
	}, {
		"code" : "aeGE",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.gapless-enc-del"
	}, {
		"code" : "aeGH",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.gapless-heur"
	}, {
		"code" : "aeGI",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.itms-genreid"
	}, {
		"code" : "aeGR",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.gapless-resy"
	}, {
		"code" : "aeGU",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.gapless-dur"
	}, {
		"code" : "aeGs",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.can-be-genius-seed"
	}, {
		"code" : "aeHC",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.has-chapter-data"
	}, {
		"code" : "aeHD",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.is-hd-video"
	}, {
		"code" : "aeHV",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.has-video"
	}, {
		"code" : "aeK1",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.drm-key1-id"
	}, {
		"code" : "aeK2",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.drm-key2-id"
	}, {
		"code" : "aeMC",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.playlist-contains-media-type-count"
	}, {
		"code" : "aeMK",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.mediakind"
	}, {
		"code" : "aeMX",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.movie-info-xml"
	}, {
		"code" : "aeMk",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.extended-media-kind"
	}, {
		"code" : "aeND",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.non-drm-user-id"
	}, {
		"code" : "aeNN",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.network-name"
	}, {
		"code" : "aeNV",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.norm-volume"
	}, {
		"code" : "aePC",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.is-podcast"
	}, {
		"code" : "aePI",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.itms-playlistid"
	}, {
		"code" : "aePP",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.is-podcast-playlist"
	}, {
		"code" : "aePS",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.special-playlist"
	}, {
		"code" : "aeRD",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.rental-duration"
	}, {
		"code" : "aeRP",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.rental-pb-start"
	}, {
		"code" : "aeRS",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.rental-start"
	}, {
		"code" : "aeRU",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.rental-pb-duration"
	}, {
		"code" : "aeSE",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.store-pers-id"
	}, {
		"code" : "aeSF",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.itms-storefrontid"
	}, {
		"code" : "aeSG",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.saved-genius"
	}, {
		"code" : "aeSI",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.itms-songid"
	}, {
		"code" : "aeSN",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.series-name"
	}, {
		"code" : "aeSP",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.smart-playlist"
	}, {
		"code" : "aeSU",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.season-num"
	}, {
		"code" : "aeSV",
		"type" : this.fieldTypes.DMAP_VERS,
		"name" : "com.apple.itunes.music-sharing-version"
	}, {
		"code" : "aeXD",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.xid"
	}, {
		"code" : "aemi",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "com.apple.itunes.media-kind-listing-item"
	}, {
		"code" : "aeml",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "com.apple.itunes.media-kind-listing"
	}, {
		"code" : "agac",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.groupalbumcount"
	}, {
		"code" : "agma",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.groupmatchedqueryalbumcount"
	}, {
		"code" : "agmi",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.groupmatchedqueryitemcount"
	}, {
		"code" : "agrp",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songgrouping"
	}, {
		"code" : "aply",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.databaseplaylists"
	}, {
		"code" : "aprm",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.playlistrepeatmode"
	}, {
		"code" : "apro",
		"type" : this.fieldTypes.DMAP_VERS,
		"name" : "daap.protocolversion"
	}, {
		"code" : "apsm",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.playlistshufflemode"
	}, {
		"code" : "apso",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.playlistsongs"
	}, {
		"code" : "arif",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.resolveinfo"
	}, {
		"code" : "arsv",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.resolve"
	}, {
		"code" : "asaa",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songalbumartist"
	}, {
		"code" : "asac",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songartworkcount"
	}, {
		"code" : "asai",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songalbumid"
	}, {
		"code" : "asal",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songalbum"
	}, {
		"code" : "asar",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songartist"
	}, {
		"code" : "asas",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songalbumuserratingstatus"
	}, {
		"code" : "asbk",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.bookmarkable"
	}, {
		"code" : "asbo",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songbookmark"
	}, {
		"code" : "asbr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songbitrate"
	}, {
		"code" : "asbt",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songbeatsperminute"
	}, {
		"code" : "ascd",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songcodectype"
	}, {
		"code" : "ascm",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songcomment"
	}, {
		"code" : "ascn",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songcontentdescription"
	}, {
		"code" : "asco",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songcompilation"
	}, {
		"code" : "ascp",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songcomposer"
	}, {
		"code" : "ascr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songcontentrating"
	}, {
		"code" : "ascs",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songcodecsubtype"
	}, {
		"code" : "asct",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songcategory"
	}, {
		"code" : "asda",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "daap.songdateadded"
	}, {
		"code" : "asdb",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songdisabled"
	}, {
		"code" : "asdc",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songdisccount"
	}, {
		"code" : "asdk",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songdatakind"
	}, {
		"code" : "asdm",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "daap.songdatemodified"
	}, {
		"code" : "asdn",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songdiscnumber"
	}, {
		"code" : "asdp",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "daap.songdatepurchased"
	}, {
		"code" : "asdr",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "daap.songdatereleased"
	}, {
		"code" : "asdt",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songdescription"
	}, {
		"code" : "ased",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songextradata"
	}, {
		"code" : "aseq",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songeqpreset"
	}, {
		"code" : "ases",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songexcludefromshuffle"
	}, {
		"code" : "asfm",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songformat"
	}, {
		"code" : "asgn",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songgenre"
	}, {
		"code" : "asgp",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songgapless"
	}, {
		"code" : "asgr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.supportsgroups"
	}, {
		"code" : "ashp",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songhasbeenplayed"
	}, {
		"code" : "askd",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "daap.songlastskipdate"
	}, {
		"code" : "askp",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songuserskipcount"
	}, {
		"code" : "asky",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songkeywords"
	}, {
		"code" : "aslc",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songlongcontentdescription"
	}, {
		"code" : "aslr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songalbumuserrating"
	}, {
		"code" : "asls",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songlongsize"
	}, {
		"code" : "aspc",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songuserplaycount"
	}, {
		"code" : "aspl",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "daap.songdateplayed"
	}, {
		"code" : "aspu",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songpodcasturl"
	}, {
		"code" : "asri",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songartistid"
	}, {
		"code" : "asrs",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songuserratingstatus"
	}, {
		"code" : "asrv",
		"type" : this.fieldTypes.DMAP_INT,
		"name" : "daap.songrelativevolume"
	}, {
		"code" : "assa",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.sortartist"
	}, {
		"code" : "assc",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.sortcomposer"
	}, {
		"code" : "assl",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.sortalbumartist"
	}, {
		"code" : "assn",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.sortname"
	}, {
		"code" : "assp",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songstoptime"
	}, {
		"code" : "assr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songsamplerate"
	}, {
		"code" : "asss",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.sortseriesname"
	}, {
		"code" : "asst",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songstarttime"
	}, {
		"code" : "assu",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.sortalbum"
	}, {
		"code" : "assz",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songsize"
	}, {
		"code" : "astc",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songtrackcount"
	}, {
		"code" : "astm",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songtime"
	}, {
		"code" : "astn",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songtracknumber"
	}, {
		"code" : "asul",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "daap.songdataurl"
	}, {
		"code" : "asur",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songuserrating"
	}, {
		"code" : "asvc",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songprimaryvideocodec"
	}, {
		"code" : "asyr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.songyear"
	}, {
		"code" : "ated",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "daap.supportsextradata"
	}, {
		"code" : "avdb",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "daap.serverdatabases"
	}, {
		"code" : "caar",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.availablerepeatstates"
	}, {
		"code" : "caas",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.availableshufflestates"
	}, {
		"code" : "caci",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "caci"
	}, {
		"code" : "cafe",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.fullscreenenabled"
	}, {
		"code" : "cafs",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.fullscreen"
	}, {
		"code" : "caia",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.isactive"
	}, {
		"code" : "cana",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dacp.nowplayingartist"
	}, {
		"code" : "cang",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dacp.nowplayinggenre"
	}, {
		"code" : "canl",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dacp.nowplayingalbum"
	}, {
		"code" : "cann",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dacp.nowplayingname"
	}, {
		"code" : "canp",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.nowplayingids"
	}, {
		"code" : "cant",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.nowplayingtime"
	}, {
		"code" : "capr",
		"type" : this.fieldTypes.DMAP_VERS,
		"name" : "dacp.protocolversion"
	}, {
		"code" : "caps",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.playerstate"
	}, {
		"code" : "carp",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.repeatstate"
	}, {
		"code" : "cash",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.shufflestate"
	}, {
		"code" : "casp",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dacp.speakers"
	}, {
		"code" : "cast",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.songtime"
	}, {
		"code" : "cavc",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.volumecontrollable"
	}, {
		"code" : "cave",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.visualizerenabled"
	}, {
		"code" : "cavs",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dacp.visualizer"
	}, {
		"code" : "ceJC",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.jukebox-client-vote"
	}, {
		"code" : "ceJI",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.jukebox-current"
	}, {
		"code" : "ceJS",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.jukebox-score"
	}, {
		"code" : "ceJV",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.jukebox-vote"
	}, {
		"code" : "ceQR",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "com.apple.itunes.playqueue-contents-response"
	}, {
		"code" : "ceQa",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.playqueue-album"
	}, {
		"code" : "ceQg",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.playqueue-genre"
	}, {
		"code" : "ceQn",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.playqueue-name"
	}, {
		"code" : "ceQr",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "com.apple.itunes.playqueue-artist"
	}, {
		"code" : "cmgt",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmcp.getpropertyresponse"
	}, {
		"code" : "cmmk",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmcp.mediakind"
	}, {
		"code" : "cmpr",
		"type" : this.fieldTypes.DMAP_VERS,
		"name" : "dmcp.protocolversion"
	}, {
		"code" : "cmsr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmcp.serverrevision"
	}, {
		"code" : "cmst",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmcp.playstatus"
	}, {
		"code" : "cmvo",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmcp.volume"
	}, {
		"code" : "ipsa",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dpap.iphotoslideshowadvancedoptions"
	}, {
		"code" : "ipsl",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dpap.iphotoslideshowoptions"
	}, {
		"code" : "mbcl",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.bag"
	}, {
		"code" : "mccr",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.contentcodesresponse"
	}, {
		"code" : "mcna",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dmap.contentcodesname"
	}, {
		"code" : "mcnm",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.contentcodesnumber"
	}, {
		"code" : "mcon",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.container"
	}, {
		"code" : "mctc",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.containercount"
	}, {
		"code" : "mcti",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.containeritemid"
	}, {
		"code" : "mcty",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.contentcodestype"
	}, {
		"code" : "mdbk",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.databasekind"
	}, {
		"code" : "mdcl",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.dictionary"
	}, {
		"code" : "mdst",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.downloadstatus"
	}, {
		"code" : "meds",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.editcommandssupported"
	}, {
		"code" : "miid",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.itemid"
	}, {
		"code" : "mikd",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.itemkind"
	}, {
		"code" : "mimc",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.itemcount"
	}, {
		"code" : "minm",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dmap.itemname"
	}, {
		"code" : "mlcl",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.listing"
	}, {
		"code" : "mlid",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.sessionid"
	}, {
		"code" : "mlit",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.listingitem"
	}, {
		"code" : "mlog",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.loginresponse"
	}, {
		"code" : "mpco",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.parentcontainerid"
	}, {
		"code" : "mper",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.persistentid"
	}, {
		"code" : "mpro",
		"type" : this.fieldTypes.DMAP_VERS,
		"name" : "dmap.protocolversion"
	}, {
		"code" : "mrco",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.returnedcount"
	}, {
		"code" : "mrpr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.remotepersistentid"
	}, {
		"code" : "msal",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.supportsautologout"
	}, {
		"code" : "msas",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.authenticationschemes"
	}, {
		"code" : "msau",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.authenticationmethod"
	}, {
		"code" : "msbr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.supportsbrowse"
	}, {
		"code" : "msdc",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.databasescount"
	}, {
		"code" : "msex",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.supportsextensions"
	}, {
		"code" : "msix",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.supportsindex"
	}, {
		"code" : "mslr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.loginrequired"
	}, {
		"code" : "msma",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.machineaddress"
	}, {
		"code" : "msml",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "msml"
	}, {
		"code" : "mspi",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.supportspersistentids"
	}, {
		"code" : "msqy",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.supportsquery"
	}, {
		"code" : "msrs",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.supportsresolve"
	}, {
		"code" : "msrv",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.serverinforesponse"
	}, {
		"code" : "mstc",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "dmap.utctime"
	}, {
		"code" : "mstm",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.timeoutinterval"
	}, {
		"code" : "msto",
		"type" : this.fieldTypes.DMAP_INT,
		"name" : "dmap.utcoffset"
	}, {
		"code" : "msts",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dmap.statusstring"
	}, {
		"code" : "mstt",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.status"
	}, {
		"code" : "msup",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.supportsupdate"
	}, {
		"code" : "mtco",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.specifiedtotalcount"
	}, {
		"code" : "mudl",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.deletedidlisting"
	}, {
		"code" : "mupd",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dmap.updateresponse"
	}, {
		"code" : "musr",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.serverrevision"
	}, {
		"code" : "muty",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dmap.updatetype"
	}, {
		"code" : "pasp",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dpap.aspectratio"
	}, {
		"code" : "pcmt",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dpap.imagecomments"
	}, {
		"code" : "peak",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.photos.album-kind"
	}, {
		"code" : "peed",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "com.apple.itunes.photos.exposure-date"
	}, {
		"code" : "pefc",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "com.apple.itunes.photos.faces"
	}, {
		"code" : "peki",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "com.apple.itunes.photos.key-image-id"
	}, {
		"code" : "pemd",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "com.apple.itunes.photos.modification-date"
	}, {
		"code" : "pfai",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dpap.failureids"
	}, {
		"code" : "pfdt",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dpap.filedata"
	}, {
		"code" : "pfmt",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dpap.imageformat"
	}, {
		"code" : "phgt",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dpap.imagepixelheight"
	}, {
		"code" : "picd",
		"type" : this.fieldTypes.DMAP_DATE,
		"name" : "dpap.creationdate"
	}, {
		"code" : "pifs",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dpap.imagefilesize"
	}, {
		"code" : "pimf",
		"type" : this.fieldTypes.DMAP_STR,
		"name" : "dpap.imagefilename"
	}, {
		"code" : "plsz",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dpap.imagelargefilesize"
	}, {
		"code" : "ppro",
		"type" : this.fieldTypes.DMAP_VERS,
		"name" : "dpap.protocolversion"
	}, {
		"code" : "prat",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dpap.imagerating"
	}, {
		"code" : "pret",
		"type" : this.fieldTypes.DMAP_DICT,
		"name" : "dpap.retryids"
	}, {
		"code" : "pwth",
		"type" : this.fieldTypes.DMAP_UINT,
		"name" : "dpap.imagepixelwidth"
	} ];

	DacpActor.prototype.isalpha = function(c) {
		return /^[a-zA-Z]*$/.test(c);
	};

	DacpActor.prototype.isascii = function(c) {
		return /^[\x00-\x7F]*$/.test(c);
	};

	DacpActor.prototype.copyBuffer = function(buffer, start, len) {
		var res = new Buffer(len);

		buffer.copy(res, 0, start, start + len);

		return res;
	};

	DacpActor.prototype.getDmapType = function(code) {
		var len = this.dmapTypes.length;

		for (var i = 0; i < len; i++) {
			if (this.dmapTypes[i].code == code) {
				return this.dmapTypes[i];
			}
		}

		return null;
	};

	DacpActor.prototype.to_int32 = function(n) {
		if (n > 2147483647 || n < -2147483648) {
			return 0;
		} else {
			return n;
		}
	};

	DacpActor.prototype.dmapRead64 = function(buffer) {
		return this
				.to_int32(bigint(buffer.readInt8(0)).and(0xff).shiftLeft(56))
				| this.to_int32(bigint(buffer.readInt8(1)).and(0xff).shiftLeft(
						48))
				| this.to_int32(bigint(buffer.readInt8(2)).and(0xff).shiftLeft(
						40))
				| this.to_int32(bigint(buffer.readInt8(3)).and(0xff).shiftLeft(
						32))
				| this.to_int32(bigint(buffer.readInt8(4)).and(0xff).shiftLeft(
						24))
				| this.to_int32(bigint(buffer.readInt8(5)).and(0xff).shiftLeft(
						16))
				| this.to_int32(bigint(buffer.readInt8(6)).and(0xff).shiftLeft(
						8))
				| this.to_int32(bigint(buffer.readInt8(7)).and(0xff));
	};

	DacpActor.prototype.dmapRead32 = function(buffer) {
		return ((buffer.readInt8(0) & 0xff) << 24)
				| ((buffer.readInt8(1) & 0xff) << 16)
				| ((buffer.readInt8(2) & 0xff) << 8)
				| ((buffer.readInt8(3) & 0xff));
	};

	DacpActor.prototype.dmap_read_16 = function(buffer) {
		return ((buffer[0] & 0xff) << 8) | (buffer[1] & 0xff);
	};

	DacpActor.prototype.add_property = function(o, field_name, value) {
		if (o instanceof Array) {
			var item = {};

			item[field_name] = value;
			o.push(item);
		} else if (o[field_name] != null) {
			var array = [];
			var item1 = {};
			var item2 = {};

			item1[field_name] = o[field_name];
			item2[field_name] = value;
			array.push(item1, item2);
			o = array;
		} else {
			o[field_name] = value;
		}
		return o;
	};

	DacpActor.prototype.toObject = function(buffer, size) {
		var item, code, field_type, field_name, o;

		size = (size == null) ? 1 : buffer.length - size + 1;

		o = {};

		while (buffer.length >= size) {
			code = this.copyBuffer(buffer, 0, 4);

			console.log("****> code " + code);

			item = this.getDmapType(code);

			console.log("****> item " + item);

			console.log("****> buffer " + buffer);

			buffer = buffer.slice(4);

			console.log("****> buffer " + buffer);

			var field_len = this.dmapRead32(buffer);

			console.log("****> fieldlen " + field_len);

			buffer = buffer.slice(4);

			console.log("****> Item " + item);

			if (item) {
				field_type = item.type;
				field_name = item.name;
			} else {
				field_type = this.fieldTypes.DMAP_UNKNOWN;
				field_name = code;

				console.log("****> fieldlen " + field_len);

				if (field_len >= 8) {
					if (this.isalpha(this.copyBuffer(buffer, 0, 4))) {
						if (this.dmapRead32(buffer.slice(4)) < field_len)
							field_type = this.fieldTypes.DMAP_DICT;
					}
				}

				console.log("****> fieldtype " + field_type);

				if (field_type === this.fieldTypes.DMAP_UNKNOWN) {
					var i, is_string = true;

					for (i = 0; i < field_len; i++) {
						if (this.isascii(buffer[i]) === false || buffer[i] < 2) {
							is_string = false;
							break;
						}
					}

					field_type = (is_string === true) ? this.fieldTypes.DMAP_STR
							: this.fieldTypes.DMAP_UINT;
				}
			}

			console.log("****> Before switch");

			switch (field_type) {
			case this.fieldTypes.DMAP_UINT:
			case this.fieldTypes.DMAP_INT:
				switch (field_len) {
				case 1:
					o[field_name] = this.to_int32(buffer[0], code);
					break;
				case 2:
					o[field_name] = this.to_int32(this.dmap_read_16(buffer),
							code);
					break;
				case 4:
					o[field_name] = this
							.to_int32(this.dmapRead32(buffer), code);
					break;
				case 8:
					o = this.add_property(o, field_name, printable.to_int32(
							this.dmapRead64(buffer), code));
					break;
				default:
					o[field_name] = this.to_data(buffer, field_len);
					break;
				}
				break;
			case this.fieldTypes.DMAP_STR:
				o[field_name] = this.to_string(buffer, 0, field_len);
				break;
			case this.fieldTypes.DMAP_DATA:
				o[field_name] = this.to_data(buffer, field_len);
				console.log(o[field_name]);

				break;
			case this.fieldTypes.DMAP_DATE:
				o[field_name] = this.to_date(this.dmapRead32(buffer));
				break;
			case this.fieldTypes.DMAP_VERS:
				if (field_len >= 4) {
					o[field_name] = this.dmap_read_16(buffer) + "."
							+ this.dmap_read_16(buffer);
				}
				break;
			case this.fieldTypes.DMAP_DICT:
				if ((sub_item = this.toObject(buffer, field_len)) == -1)
					return -1;
				o = this.add_property(o, field_name, sub_item);
				break;
			case this.fieldTypes.DMAP_UNKNOWN:
				break;
			}

			buffer = buffer.slice(field_len);
		}

		return o;
	};

	DacpActor.prototype.parse = function(buffer, options) {
		var result = {};

		var result = this.toObject(buffer);

		return result;
	};

	/**
	 * TODO Duplicate
	 */
	DacpActor.prototype.to_int32 = function(value, code) {
		if (code !== null && code.toString() === "mcnm") {
			var buffer = new Buffer([ (value >> 24) & 0xff,
					(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff ]);
			return buffer.toString();
		}

		return value;
	};

	DacpActor.prototype.to_date = function(value) {
		return new Date(value * 1000);
	};

	DacpActor.prototype.to_string = function(buffer, start, len) {
		b = new Buffer(len);

		buffer.copy(b, 0, start, start + len);
		return b.toString();
	};

	DacpActor.prototype.to_data = function(buffer, len) {
		var hexchars = "012345789abcdef";
		var result = "";

		for (var i = 0; i < len; i++) {
			result += hexchars[(buffer.readInt8(i) >> 4)];
			result += hexchars[(buffer.readInt8(i) & 0x0f)];
		}

		return result;
	};
}

// TODO Temporary test

/*
var dacp = new DacpActor();

dacp.login().then(function(response) {
	console.log(response['dmap.loginresponse']['dmap.status']);

	sessionId = response['dmap.loginresponse']['dmap.sessionid'];
}).fail(function(error) {
	console.log(error);
});*/