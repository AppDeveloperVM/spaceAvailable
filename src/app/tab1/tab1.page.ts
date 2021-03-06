import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Geolocation, GeolocationOptions ,Geoposition ,PositionError } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@awesome-cordova-plugins/native-geocoder/ngx';

declare const google;

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit{

  @ViewChild('map',  {static: false}) mapElement: ElementRef;
  map: any;
  address: string;
  lat: string;
  long: string;
  autocomplete: { input: string };
  autocompleteItems: any[];
  location: any;
  placeid: any;
  googleAutocomplete: any;

  markers = [];
  infoWindows: any = [];

  options: PositionOptions;
  currentPos: Geoposition;
  places: Array<any>;
  hierarchicalData: any;

  city: string;
  country: string;

  constructor(
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    public zone: NgZone
    ) {
      this.googleAutocomplete = new google.maps.places.AutocompleteService();
      this.autocomplete = { input: '' };
      this.autocompleteItems = [];
    }

  ngOnInit(): void {
    this.loadMap();
  }

  loadMap() {
    //FIRST GET THE LOCATION FROM THE DEVICE.
    this.geolocation.getCurrentPosition().then((resp) => {
      const latLng = new google.maps.LatLng(resp.coords.latitude, resp.coords.longitude);
      const mapOptions = {
        enableHighAccuracy : true,// optional
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      //LOAD THE MAP WITH THE PREVIOUS VALUES AS PARAMETERS.
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      this.map.addListener('tilesloaded', () => {
        //console.log('accuracy',this.map, this.map.center.lat());

        this.lat = this.map.center.lat();
        this.long = this.map.center.lng();

      });


    }).catch((error) => { // error handling
      console.log('Error getting location', error);
    });
  }

  userPosition(){

    this.geolocation.getCurrentPosition().then((resp) => {
      //this.map.setCameraTarget(resp[0].position);
      alert( this.getAddressFromCoords(resp.coords.latitude,  resp.coords.longitude) );
    }).catch((error) => { // error handling
      console.log('Error getting location', error);
    });

  }

  //--- Get location data Functions ---

  getAddressFromCoords(lattitude, longitude) {

    console.log('getAddressFromCoords : '+ lattitude+' '+longitude);
    const options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 1
    };

    this.nativeGeocoder.reverseGeocode(lattitude, longitude, options)
      .then((result: NativeGeocoderResult[]) => {
        this.address = '';

        const responseAddress = [];
        for (const [key, value] of Object.entries(result[0])) {
          if(value.length > 0)
          { responseAddress.push(value); }
        }
        responseAddress.reverse();
        for (const value of responseAddress) {
          this.address += value+', ';
          //this.getCityCountry(value);
        }
        //alert(this.address);
        //alert(JSON.stringify(result[0]));

        this.address = this.address.slice(0, -2);

        console.log('address: ' + this.address);
      })
      .catch((error: any) =>{
        this.address = 'Address Not Available!';
        console.log('Address Not Available');
        //alert(error.message);
      });

      if(this.address!==''){return this.address;}


  }

  getCityCountry(jsondata){
    for(const r of jsondata.formatted_address ) {
      for(const n of r.address_components ) {
          if(n.types[0] === 'locality' && n.types[1] === 'political') {
              this.city = n.long_name;
          }

          if(n.type[0] === 'country' && n.types[1] === 'political') {
              this.country = n.long_name;
          }
      }
  }
  }

  getRestaurants(latLng)
  {
    const service = new google.maps.places.PlacesService(this.map);
    const request = {
        location : latLng,
        radius : 8047 ,
        types: ['restaurant']
    };
    return new Promise((resolve,reject)=>{
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        service.nearbySearch(request,function(results,status){
            if(status === google.maps.places.PlacesServiceStatus.OK)
            {
              /*
                results.forEach((prediction) => {
                  this.places.push(prediction);
                });
                */

                resolve(results);
            }else
            {
                reject(status);
            }

        });
    });

  }

  //--- Markers Functions ---

  addMarker(place){
    const marker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: place.geometry.location
    });

    this.addInfoWindowToMarker(marker);
  }

  addInfoWindowToMarker(marker){

    const latitude = marker.latitude;
    const longitude = marker.longitude;
    const address = this.getAddressFromCoords(latitude , longitude);

    //Custom infoContent
    const infoWindowContent = '<div id="content">' +
                                '<h2 id="heading">'+ address + '</h2>' +
                                '<p>Latitude: '+ marker.latitude + '</p>' +
                                '<p>Longitude: ' + marker.longitude + '</p>' +
                              '</div>';

    const infoWindow = new google.maps.InfoWindow({
      content: address
    });

    google.maps.event.addListener(marker, 'click', () => {
      this.closeAllInfoWindows();
      infoWindow.open(this.map, marker);
    });
    this.infoWindows.push(infoWindow);
    this.markers.push(marker);

  }

  setMapOnAll(map) {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(map);
    }
  }

  deleteMarkers() {
    this.clearMarkers();
    this.markers = [];
  }

  clearMarkers() {
    this.setMapOnAll(null);
  }

  closeAllInfoWindows(){
    for(const window of this.infoWindows){
      window.close();
    }
  }

  //--- Called from page.html searchBox ---

  //FUNCTION SHOWING THE COORDINATES OF THE POINT AT THE CENTER OF THE MAP
  showCords(){
    alert('lat' +this.lat+', long'+this.long );
  }

  updatePlacesList(){
    const latLng = new google.maps.LatLng(this.lat, this.long);

    this.deleteMarkers();

    this.getRestaurants(latLng).then((results: Array<any>)=>{

      //this.places = results;
      if(this.places == null){
        this.places = [];
      }

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for(let i = 0 ;i < results.length ; i++)
      {
        this.addMarker(results[i]);
      }

      //alert( JSON.stringify(this.places) );
    },(status)=>console.log(status));
  }

  //AUTOCOMPLETE, SIMPLY LOAD THE PLACE USING GOOGLE PREDICTIONS AND RETURNING THE ARRAY.
  updateSearchResults(){
    if (this.autocomplete.input === '') {
      this.autocompleteItems = [];
      return;
    }
    this.googleAutocomplete.getPlacePredictions({ input: this.autocomplete.input },
    (predictions, status) => {
      this.autocompleteItems = [];
      this.zone.run(() => {
        predictions.forEach((prediction) => {
          this.autocompleteItems.push(prediction);
        });
      });
    });
  }

  //wE CALL THIS FROM EACH ITEM.
  selectSearchResult(item) {
    ///WE CAN CONFIGURE MORE COMPLEX FUNCTIONS SUCH AS UPLOAD DATA TO FIRESTORE OR LINK IT TO SOMETHING
    alert(JSON.stringify(item));
    this.placeid = item.place_id;
  }

  //lET'S BE CLEAN! THIS WILL JUST CLEAN THE LIST WHEN WE CLOSE THE SEARCH BAR.
  clearAutocomplete(){
    this.autocompleteItems = [];
    this.autocomplete.input = '';
  }

  //sIMPLE EXAMPLE TO OPEN AN URL WITH THE PLACEID AS PARAMETER.
  goTo(){
    return window.location.href = 'https://www.google.com/maps/search/?api=1&query=Google&query_place_id='+this.placeid;
  }

}
