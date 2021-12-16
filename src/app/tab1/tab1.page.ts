import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';

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
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      //LOAD THE MAP WITH THE PREVIOUS VALUES AS PARAMETERS.
      this.getAddressFromCoords(resp.coords.latitude, resp.coords.longitude);
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      this.map.addListener('tilesloaded', () => {
        console.log('accuracy',this.map, this.map.center.lat());
        this.getAddressFromCoords(this.map.center.lat(), this.map.center.lng());
        this.lat = this.map.center.lat();
        this.long = this.map.center.lng();
      });
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  getAddressFromCoords(lattitude, longitude) {
    console.log('getAddressFromCoords '+lattitude+' '+longitude);
   const options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };
    this.nativeGeocoder.reverseGeocode(lattitude, longitude, options)
      .then((result: NativeGeocoderResult[]) => {
        this.address = '';
        const responseAddress = [];
        for (const [key, value] of Object.entries(result[0])) {
          if(value.length>0)
          { responseAddress.push(value); }
        }
        responseAddress.reverse();
        for (const value of responseAddress) {
          this.address += value+', ';
        }
        this.address = this.address.slice(0, -2);
      })
      .catch((error: any) =>{
        this.address = 'Address Not Available!';
      });
  }

  //FUNCTION SHOWING THE COORDINATES OF THE POINT AT THE CENTER OF THE MAP
  showCords(){
    alert('lat' +this.lat+', long'+this.long );
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
