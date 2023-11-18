/**
 * 
 */

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

const { filterBtnHandler, sortBtnHandler, resetBtnHandler } = (oParks => {

    const hasGeol = 'geolocation' in navigator;

    let parks = [...oParks];

    const distance = (lat1, lat2, lon1, lon2) => {
        return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 69;
    };
    
    const degrees = (lat1, lat2, lon1, lon2) => {
        const latd = lat2 - lat1;
        const lond = lon2 - lon1;
        const theta = Math.atan2(latd, lond) * 180 / Math.PI;
        return theta < 0 ? theta + 360 : theta;
    };

    const populateListItems = (parks) => {
        const ul = document.querySelector('ul');
        if (!parks.length) {
            ul.innerHTML = '<li class="common"><p>No results. Reset and apply different filters.</p></li>';
        } else {
            const htmlParks = parks.map(park => {
            const address = park.street + ', ' + park.city + ', ' + park.state;
            const html = `
                <li class="common">
                    <h3 class="name">${park.name}</h3><span class="apprx-dist">${park.dist ? ' ~'.concat(Math.round(park.dist * 10) / 10, ' mi ', `<div class="arrow" style="transform: rotate(${-Math.trunc(park.deg)}deg);">&#8594</div>`) : ''}</span>
                    <hr>
                    <h4>Type: ${park.type}</h4>
                    <hr>
                    <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank">${address}</a></p>
                </li>
                `;
                return html;
            }).join('');
            ul.innerHTML = htmlParks;
        }
    };
    
    const setParkDD = cb => {
        navigator.geolocation.getCurrentPosition(position => {
            oParks.forEach(oPark => {
                oPark.dist = distance(position.coords.latitude, oPark.lat, position.coords.longitude, oPark.lon);
                oPark.deg = degrees(position.coords.latitude, oPark.lat, position.coords.longitude, oPark.lon);
            });
            cb();
        });
    };

    document.addEventListener('DOMContentLoaded', populateListItems.bind(null, oParks));
    const styles = getComputedStyle(document.documentElement);
    const normal = styles.getPropertyValue('--clr-p-2');
    const highlight = styles.getPropertyValue('--clr-p-3');

    return {

        filterBtnHandler() {

            let filteredParks = parks;
            
            let filterByCity = {};
            let filterByType = {};

            const filterBtnCats = () => {
                const cityObj = {};
                const typeObj = {};
                filteredParks.forEach(park => {
                    if (!cityObj[park.city]) cityObj[park.city] = true;
                    if (!typeObj[park.type]) typeObj[park.type] = true;
                });

                return {
                    cities: Object.keys(cityObj),
                    types: Object.keys(typeObj),
                };
            };

            const renderFilterBtns = (element, filter) => {
                const htmlFilterBtns = filterBtnCats()[filter].map(e => {
                    const html = `
                        <button class="filter-category-btn common">${e}</button>
                    `;
                    return html;
                });
                htmlFilterBtns.sort();
                element.insertAdjacentHTML('afterend', htmlFilterBtns.join(''));
            };

            const { filterDistanceBtnHandler, filterCityBtnHandler, filterTypeBtnHandler } = (() => {

                return {

                    filterDistanceBtnHandler() {},
                    
                    filterTypeBtnHandler() {
                        
                        renderFilterBtns(document.querySelector('.filter-type-modal .modal-controls'), 'types');
                        
                        const filterTypeModal = document.querySelector('.filter-type-modal');
                        const filterTypeCancelBtn = document.querySelector('.filter-type-modal .filter-cancel-btn');
                        const filterTypeOkBtn = document.querySelector('.filter-type-modal .filter-ok-btn');
                        const filterByTypeBtns = document.querySelectorAll('.filter-type-modal > button');
                        
                        filterTypeModal.showModal();

                        const filterNum = document.querySelector('.filter-type-modal > .filter-num > span');
                        filterNum.textContent = '0 results';
                        
                        const filterByTypeBtnHandler = event => {
                            if (filterByType[event.target.textContent]) {
                                delete filterByType[event.target.textContent];
                                event.target.style.backgroundColor = normal;
                            } else {
                                filterByType[event.target.textContent] = true;
                                event.target.style.backgroundColor = highlight;
                            }

                            const numResults = filteredParks.filter(park => {
                                return filterByType.hasOwnProperty(park.type);
                            }).length;
                            filterNum.textContent = `${numResults} results`;
                        };

                        const filterByTypeCloseModal = () => {
                            filterByType = {};
                            for (const btn of filterByTypeBtns) {
                                btn.remove();
                            }
                            filterTypeCancelBtn.removeEventListener('click', filterByTypeModalCancelBtnHandler);
                            filterTypeOkBtn.removeEventListener('click', filterByTypeModalOkBtnHandler);
                            filterTypeModal.close();
                        };

                        const filterByTypeModalCancelBtnHandler = () => {
                            filterByTypeCloseModal();
                        };

                        const filterByTypeModalOkBtnHandler = () => {
                            filteredParks = filteredParks.filter(park => {
                                return filterByType.hasOwnProperty(park.type);
                            });
                            filterByTypeCloseModal();
                        };

                        filterTypeCancelBtn.addEventListener('click', filterByTypeModalCancelBtnHandler);
                        filterTypeOkBtn.addEventListener('click', filterByTypeModalOkBtnHandler);
                        filterByTypeBtns.forEach(btn => {
                            btn.addEventListener('click', filterByTypeBtnHandler);
                        });

                    },

                    filterCityBtnHandler() {
                        
                        renderFilterBtns(document.querySelector('.filter-city-modal .modal-controls'), 'cities');

                        const filterCityModal = document.querySelector('.filter-city-modal');
                        const filterCityCancelBtn = document.querySelector('.filter-city-modal .filter-cancel-btn');
                        const filterCityOkBtn = document.querySelector('.filter-city-modal .filter-ok-btn');
                        const filterByCityBtns = document.querySelectorAll('.filter-city-modal > button');
                        
                        filterCityModal.showModal();

                        const filterNum = document.querySelector('.filter-city-modal > .filter-num > span');
                        filterNum.textContent = '0 results';

                        const cityNameBtnHandler = event => {

                            if (filterByCity[event.target.textContent]) {
                                delete filterByCity[event.target.textContent];
                                event.target.style.backgroundColor = normal;
                            } else {
                                filterByCity[event.target.textContent] = true;
                                event.target.style.backgroundColor = highlight;
                            }
                            
                            const numResults = filteredParks.filter(park => {
                                return filterByCity.hasOwnProperty(park.city);
                            }).length;
                            filterNum.textContent = `${numResults} results`;
                        };

                        const filterByCityCloseModal = () => {
                            filterByCity = {};
                            for (const btn of filterByCityBtns) {
                                btn.remove();
                            }
                            filterCityCancelBtn.removeEventListener('click', filterByCityModalCancelBtnHandler);
                            filterCityOkBtn.removeEventListener('click', filterByCityModalOkBtnHandler);
                            filterCityModal.close();
                        };

                        const filterByCityModalCancelBtnHandler = () => {
                            filterByCityCloseModal();
                        };

                        const filterByCityModalOkBtnHandler = () => {
                            filteredParks = filteredParks.filter(park => {
                                return filterByCity.hasOwnProperty(park.city);
                            });
                            filterByCityCloseModal();
                        };

                        filterCityCancelBtn.addEventListener('click', filterByCityModalCancelBtnHandler);
                        filterCityOkBtn.addEventListener('click', filterByCityModalOkBtnHandler);
                        filterByCityBtns.forEach(btn => {
                            btn.addEventListener('click', cityNameBtnHandler);
                        });

                    },

                };

            })();

            const filterModal = document.querySelector('.filter-modal');

            filterModal.showModal();

            const filterCancelBtn = document.querySelector('.filter-cancel-btn');
            const filterOkBtn = document.querySelector('.filter-ok-btn');
            const filterDistanceBtn = document.querySelector('.filter-distance');
            const filterCityBtn = document.querySelector('.filter-city');
            const filterTypeBtn = document.querySelector('.filter-type');
            
            const filterCloseModal = () => {
                filterCancelBtn.removeEventListener('click', filterCloseModal);
                filterOkBtn.removeEventListener('click', filterModalOkBtnHandler);
                filterCityBtn.removeEventListener('click', filterCityBtnHandler);
                filterTypeBtn.removeEventListener('click', filterTypeBtnHandler);
                filterModal.close();
            };
            
            const filterModalOkBtnHandler = () => {
                parks = filteredParks;
                populateListItems(parks);
                filterCloseModal();
            }

            filterCancelBtn.addEventListener('click', filterCloseModal);
            filterOkBtn.addEventListener('click', filterModalOkBtnHandler);
            // filterDistanceBtn.addEventListener
            filterCityBtn.addEventListener('click', filterCityBtnHandler);
            filterTypeBtn.addEventListener('click', filterTypeBtnHandler);


        },

        sortBtnHandler() {

            const sortModal = document.querySelector('.sort-modal');
            const sortByBtns = document.querySelectorAll('.sort-modal > button');

            const order = [];
            order.length = sortByBtns.length;
            order.fill(0);

            sortModal.showModal();

            const sortByBtnHandler = (event = {target: null}) => {
                sortByBtns.forEach((btn, i) => {
                    const sortOrderSpan = btn.querySelector('.sort-order');
                    if (btn === event.target) {
                        if (order[i]) {
                            if (order[i] === 1) {
                                order[i] = -1;
                                sortOrderSpan.textContent = '<';
                            } else {
                                order[i] = 1;
                                sortOrderSpan.textContent = '>';
                            }
                        } else {
                            order[i] = 1;
                        }
                        btn.style.backgroundColor = highlight;
                    } else {
                        sortOrderSpan.textContent = '>';
                        order[i] = 0;
                        btn.style.backgroundColor = normal;
                    }
                });
            };

            const sortByKeyAndPopulate = (key, o) => {
                const ord = o === 1 ? {lt: -1, gt: 1} : {lt: 1, gt: -1};
                parks.sort((a, b) => {
                    if (a[key] < b[key]) return ord.lt;
                    if (a[key] > b[key]) return ord.gt;
                    return 0;
                });
                populateListItems(parks);
            }

            const sortDist = o => {
                if (hasGeol) {
                    setParkDD(sortByKeyAndPopulate.bind(null, 'dist', o));
                } else {
                    alert('this web app needs access to gps to function properly');
                }
            };

            const sortCancelBtn = document.querySelector('.sort-cancel-btn');
            const sortOkBtn = document.querySelector('.sort-ok-btn');
            const sortDistanceBtn = document.querySelector('.sort-distance');
            const sortCityBtn = document.querySelector('.sort-city');
            const sortTypeBtn = document.querySelector('.sort-type');

            const closeModal = () => {
                sortByBtnHandler();
                sortTypeBtn.removeEventListener('click', sortByBtnHandler);
                sortCityBtn.removeEventListener('click', sortByBtnHandler);
                sortDistanceBtn.removeEventListener('click', sortByBtnHandler);
                sortCancelBtn.removeEventListener('click', closeModal);
                sortOkBtn.removeEventListener('click', sortOkBtnHandler);
                sortModal.close();
            };

            const sortOkBtnHandler = () => {
                if (order.some(e => e !== 0)) {
                    const i = order.findIndex(e => e !== 0);
                    const sortBy = sortByBtns[i].classList[0];
                    if (sortBy === 'sort-type') {
                        sortByKeyAndPopulate('type', order[i]);
                    } else if (sortBy === 'sort-city') {
                        sortByKeyAndPopulate('city', order[i]);
                    } else if (sortBy === 'sort-distance') {
                        sortDist(order[i]);
                    }
                }
                closeModal();
            }
        
            sortOkBtn.addEventListener('click', sortOkBtnHandler);
            sortCancelBtn.addEventListener('click', closeModal);
            sortDistanceBtn.addEventListener('click', sortByBtnHandler);
            sortCityBtn.addEventListener('click', sortByBtnHandler);
            sortTypeBtn.addEventListener('click', sortByBtnHandler);

        },

        resetBtnHandler() {
            parks = [...oParks];
            populateListItems(parks);
        },

    }

})([{"name":"A.B. Smith Park","type":"City Park","lat":27.331695,"lon":-82.527783,"street":"2110 Adams Ln","city":"Sarasota","state":"FL"},{"name":"Alligator Creek Conservation and Recreation Area","type":"Natural Area","lat":27.07169,"lon":-82.381193,"street":"702 Venice East Blvd","city":"Venice","state":"FL"},{"name":"Arlington Park and Aquatic Center","type":"City Park","lat":27.319592,"lon":-82.517348,"street":"2650 Waldemere St","city":"Sarasota","state":"FL"},{"name":"Atwater Community Park","type":"City Park","lat":27.068120,"lon":-82.110719,"street":"4475 Skyway Ave","city":"North Port","state":"FL"},{"name":"Babe Ruth Park","type":"Athletic Facility","lat":27.333835,"lon":-82.510381,"street":"185 S Pompano Ave","city":"Sarasota","state":"FL"},{"name":"Bay Street Park","type":"Neighborhood and Community","lat":27.196726,"lon":-82.485814,"street":"300 Bay St","city":"Osprey","state":"FL"},{"name":"Bayfront Community Center","type":"City Park","lat":27.343318,"lon":-82.547829,"street":"803 N Tamiami Trl","city":"Sarasota","state":"FL"},{"name":"Bayfront Park","type":"City Park","lat":27.388111,"lon":-82.63974,"street":"4052 Gulf of Mexico Dr","city":"Longboat Key","state":"FL"},{"name":"Bayfront Park Addition","type":"Water Access","lat":27.387281,"lon":-82.639779,"street":"4000 Gulf of Mexico Dr","city":"Longboat Key","state":"FL"},{"name":"Bee Ridge Park","type":"Athletic Facility","lat":27.290901,"lon":-82.50586,"street":"4430 S Lockwood Ridge Rd","city":"Sarasota","state":"FL"},{"name":"Blackburn Point Park","type":"Water Access","lat":27.180649,"lon":-82.495379,"street":"800 Blackburn Point Rd","city":"Osprey","state":"FL"},{"name":"Blackburn Point Park","type":"Water Access","lat":27.191859,"lon":-82.479617,"street":"421 Blacburn Point Rd","city":"Osprey","state":"FL"},{"name":"Blalock Park","type":"City Park","lat":27.09613,"lon":-82.44544,"street":"300 Nokomis Ave S","city":"Venice","state":"FL"},{"name":"Blind Pass Beach Park","type":"Beach","lat":26.964472,"lon":-82.386051,"street":"6725 Manasota Key Rd","city":"Englewood","state":"FL"},{"name":"Blue Ridge Park","type":"City Park","lat":27.059914,"lon":-82.204568,"street":"2155 Ridgewood Dr","city":"North Port","state":"FL"},{"name":"Bobby Jones Golf Club","type":"City Park","lat":27.351161,"lon":-82.488107,"street":"1000 Circus Blvd","city":"Sarasota","state":"FL"},{"name":"Buchan Airport Community Park / Kiwanis Foundation Park","type":"Neighborhood and Community","lat":26.989144,"lon":-82.373182,"street":"1390 Old Englewood Rd","city":"Englewood","state":"FL"},{"name":"Butler Park","type":"City Park","lat":27.071351,"lon":-82.226477,"street":"6203 W Price Blvd","city":"North Port","state":"FL"},{"name":"Bypass Park - Foxworthy Campus","type":"Athletic Facility","lat":27.092236,"lon":-82.427864,"street":"1101 Gulf Coast Blvd","city":"Venice","state":"FL"},{"name":"Carlton Reserve","type":"Natural Area","lat":27.128657,"lon":-82.332306,"street":"1800 Mabry Carlton Pkwy","city":"Venice","state":"FL"},{"name":"Caspersen Beach Park","type":"Beach","lat":27.058333,"lon":-82.444462,"street":"4100 Harbor Drive S","city":"Venice","state":"FL"},{"name":"Celery Fields Regional Stormwater Facility","type":"Natural Area","lat":27.325636,"lon":-82.433833,"street":"6893 Palmer Blvd","city":"Sarasota","state":"FL"},{"name":"Centennial Park","type":"Water Access","lat":27.346395,"lon":-82.548023,"street":"1059 N Tamiami Trl","city":"Sarasota","state":"FL"},{"name":"Centennial Park","type":"City Park","lat":27.100362,"lon":-82.446554,"street":"200 W Venice Ave","city":"Venice","state":"FL"},{"name":"Chuck Reiter Park","type":"Athletic Facility","lat":27.082819,"lon":-82.441641,"street":"250 Fort St","city":"Venice","state":"FL"},{"name":"Colonial Oaks Park","type":"Recreation Center","lat":27.31194,"lon":-82.46394,"street":"5300 Colonial Oaks Blvd","city":"Sarasota","state":"FL"},{"name":"Dallas White Park","type":"City Park","lat":27.046396,"lon":-82.233703,"street":"5900 Greenwood Ave","city":"North Port","state":"FL"},{"name":"Dr. Martin Luther King Jr. Memorial Park","type":"City Park","lat":27.359131,"lon":-82.545837,"street":"2523 Cocoanut Ave","city":"Sarasota","state":"FL"},{"name":"Dr. Martin Luther King Jr. Memorial Park","type":"City Park","lat":27.359526,"lon":-82.54458,"street":"2524 Cocoanut Ave","city":"Sarasota","state":"FL"},{"name":"Ed Smith Sports Complex","type":"Athletic Facility","lat":27.34861,"lon":-82.51553,"street":"2700 12th St","city":"Sarasota","state":"FL"},{"name":"Englewood Park ","type":"Neighborhood and Community","lat":26.964498,"lon":-82.359931,"street":"101 N Orange St","city":"Englewood","state":"FL"},{"name":"Englewood Sports Complex","type":"Athletic Facility","lat":26.97204,"lon":-82.32498,"street":"1300 S River Rd","city":"Englewood","state":"FL"},{"name":"Fruitville Park","type":"Athletic Facility","lat":27.343181,"lon":-82.467706,"street":"5151 Richardson Rd","city":"Sarasota","state":"FL"},{"name":"Garden of the Five Senses Park","type":"City Park","lat":27.055508,"lon":-82.240928,"street":"4299 Pan American Blvd","city":"North Port","state":"FL"},{"name":"George Mullen Activity Center","type":"City Park","lat":27.073974,"lon":-82.204779,"street":"1602 Kramer Way","city":"North Port","state":"FL"},{"name":"Glebe Park","type":"Athletic Facility","lat":27.273631,"lon":-82.550095,"street":"1000 Glebe Ln","city":"Sarasota","state":"FL"},{"name":"Hart's Landing","type":"City Park","lat":27.334025,"lon":-82.553605,"street":"920 John Ringling Cswy","city":"Sarasota","state":"FL"},{"name":"Hecksher Park","type":"Neighborhood and Community","lat":27.100517,"lon":-82.451111,"street":"450 W Venice Ave","city":"Venice","state":"FL"},{"name":"Higel Marine Park","type":"Water Access","lat":27.108207,"lon":-82.462216,"street":"1250 Tarpon Center Dr","city":"Venice","state":"FL"},{"name":"Highland Ridge Park","type":"City Park","lat":27.036321,"lon":-82.240971,"street":"6225 Kenwood Dr","city":"North Port","state":"FL"},{"name":"Humphris Park. South Jetty","type":"City Park","lat":27.112225,"lon":-82.466109,"street":"2000 Tarpon Center Dr","city":"Venice","state":"FL"},{"name":"Indian Mound Park","type":"Water Access","lat":26.956929,"lon":-82.362747,"street":"210 Winson Ave","city":"Englewood","state":"FL"},{"name":"Ken Thompson Park","type":"City Park","lat":27.334958,"lon":-82.574969,"street":"1700 Ken Thompson Pkwy","city":"Sarasota","state":"FL"},{"name":"Knight Trail Park","type":"Athletic Facility","lat":27.15937,"lon":-82.40925,"street":"3445 Rustic Rd","city":"Nokomis","state":"FL"},{"name":"Lakeview Park","type":"Neighborhood and Community","lat":27.290051,"lon":-82.428812,"street":"7255 Hand Rd","city":"Sarasota","state":"FL"},{"name":"Larry Thoennissen Athletic Fields","type":"City Park","lat":27.073974,"lon":-82.204779,"street":"1602 Kramer Way","city":"North Port","state":"FL"},{"name":"Laurel Park and Sandra Sims Terry Community Center","type":"Recreation Center","lat":27.13429,"lon":-82.450376,"street":"509 Collins Rd","city":"Nokomis","state":"FL"},{"name":"Legacy Park","type":"Neighborhood and Community","lat":27.101433,"lon":-82.441606,"street":"395 E Venice Ave","city":"Sarasota","state":"FL"},{"name":"Legacy Trail","type":"Trail","lat":27.249045,"lon":-82.475301,"street":"7301 McIntosh Rd","city":"Sarasota","state":"FL"},{"name":"Legacy Trail","type":"Trail","lat":27.100757,"lon":-82.440152,"street":"303 E Venice Ave","city":"Venice","state":"FL"},{"name":"Lemon Bay Park","type":"Natural Area","lat":26.973002,"lon":-82.37437,"street":"570 Bay Park Blvd","city":"Englewood","state":"FL"},{"name":"Lido Beach","type":"Beach","lat":27.31276,"lon":-82.57704,"street":"400 Benjamin Franklin Dr","city":"Sarasota","state":"FL"},{"name":"Lincer Preserve","type":"Natural Area","lat":27.122359,"lon":-82.332252,"street":"4901 Border Rd","city":"Venice","state":"FL"},{"name":"Locklear Park","type":"Neighborhood and Community","lat":27.327382,"lon":-82.505606,"street":"821 S Lockwood Ridge Rd","city":"Sarasota","state":"FL"},{"name":"Longboat Key Tennis Center","type":"City Park","lat":27.370008,"lon":-82.624529,"street":"590 Bay Isles Rd","city":"Longboat Key","state":"FL"},{"name":"Longwood Park","type":"Recreation Center","lat":27.386356,"lon":-82.481564,"street":"6050 Longwood Run Blvd","city":"Sarasota","state":"FL"},{"name":"Luke Wood Park North","type":"City Park","lat":27.328843,"lon":-82.534757,"street":"1851 Mound St","city":"Sarasota","state":"FL"},{"name":"Luke Wood Park South","type":"City Park","lat":27.328843,"lon":-82.534757,"street":"1850 Mound St","city":"Sarasota","state":"FL"},{"name":"Manasota Beach Park","type":"Beach","lat":27.010748,"lon":-82.412429,"street":"8570 Manasota Key Rd","city":"Englewood","state":"FL"},{"name":"Maxine Barritt Park","type":"Beach","lat":27.070838,"lon":-82.449749,"street":"1800 Harbor Dr S","city":"Venice","state":"FL"},{"name":"Miss Sarasota Softball Complex","type":"Athletic Facility","lat":27.348761,"lon":-82.473625,"street":"4770 17th St","city":"Sarasota","state":"FL"},{"name":"Morgan Family Community Center","type":"City Park","lat":27.068399,"lon":-82.224707,"street":"6207 W Price Blvd","city":"North Port","state":"FL"},{"name":"Myakka River State Park","type":"State Land","lat":27.234486,"lon":-82.311204,"street":"13207 State Road 72","city":"Sarasota","state":"FL"},{"name":"Myakkahatchee Creek Environmental Park","type":"City Park","lat":27.113062,"lon":-82.205949,"street":"6968 Reisterstown Rd","city":"North Port","state":"FL"},{"name":"Narramore Sports Complex","type":"City Park","lat":27.073381,"lon":-82.23849,"street":"7508 Glenallen Blvd","city":"North Port","state":"FL"},{"name":"Nathan Benderson Park","type":"Athletic Facility","lat":27.376034,"lon":-82.452265,"street":"5851 Nathan Benderson Cir","city":"Sarasota","state":"FL"},{"name":"Newtown Estates Park","type":"Recreation Center","lat":27.360924,"lon":-82.523406,"street":"2800 Newtown Blvd","city":"Sarasota","state":"FL"},{"name":"Nokomis Beach Park","type":"Beach","lat":27.12446,"lon":-82.47026,"street":"100 Casey Key Rd","city":"Nokomis","state":"FL"},{"name":"Nokomis Community Park","type":"Recreation Center","lat":27.117743,"lon":-82.446885,"street":"234 Nippino Trl E","city":"Nokomis","state":"FL"},{"name":"North Brohard Park","type":"Beach","lat":27.074703,"lon":-82.450821,"street":"1400 Harbor Dr S","city":"Venice","state":"FL"},{"name":"North Jetty Park","type":"Beach","lat":27.11609,"lon":-82.46716,"street":"1000 S Casey Key Rd","city":"Nokomis","state":"FL"},{"name":"North Port Scout House","type":"City Park","lat":27.045571,"lon":-82.231802,"street":"5845 Greenwood Ave","city":"North Port","state":"FL"},{"name":"North Port Skate Park","type":"City Park","lat":27.047149,"lon":-82.23523,"street":"5651 North Port Blvd","city":"North Port","state":"FL"},{"name":"Oscar Scherer State Park","type":"State Land","lat":27.16923,"lon":-82.47754,"street":"1843 S Tamiami Trl","city":"Osprey","state":"FL"},{"name":"Patriots Park","type":"Neighborhood and Community","lat":27.110582,"lon":-82.444204,"street":"800 Venetia Bay Blvd","city":"Venice","state":"FL"},{"name":"Payne Park","type":"City Park","lat":27.331695,"lon":-82.527783,"street":"2110 Adams Ln","city":"Sarasota","state":"FL"},{"name":"Payne Park Tennis Center","type":"City Park","lat":27.334591,"lon":-82.529609,"street":"2050 Adams Lane","city":"Sarasota","state":"FL"},{"name":"Phillippi Estate Park","type":"Recreation Center","lat":27.27272,"lon":-82.53072,"street":"5500 S Tamiami Trl","city":"Sarasota","state":"FL"},{"name":"Pine View School - Athletic Court Facilities","type":"Athletic Facility","lat":27.187609,"lon":-82.478977,"street":"1 Python Path","city":"Osprey","state":"FL"},{"name":"Pinebrook Park","type":"Athletic Facility","lat":27.108244,"lon":-82.415224,"street":"1251 Pinebrook Rd","city":"Venice","state":"FL"},{"name":"Pinecraft Park","type":"Neighborhood and Community","lat":27.319526,"lon":-82.503944,"street":"1420 Gilbert Ave","city":"Sarasota","state":"FL"},{"name":"Red Bug Slough Preserve","type":"Natural Area","lat":27.277424,"lon":-82.500460,"street":"5200 Beneva Rd","city":"Sarasota","state":"FL"},{"name":"Red Rock Park","type":"Neighborhood and Community","lat":27.297615,"lon":-82.536723,"street":"3987 Camino Real","city":"Sarasota","state":"FL"},{"name":"Robert L. Taylor Community Complex","type":"City Park","lat":27.36564,"lon":-82.533943,"street":"1845 34th St","city":"Sarasota","state":"FL"},{"name":"Rothenbach Park","type":"Neighborhood and Community","lat":27.295706,"lon":-82.397246,"street":"8650 Bee Ridge Rd","city":"Sarasota","state":"FL"},{"name":"Sarasota Lawn Bowling","type":"City Park","lat":27.343998,"lon":-82.547486,"street":"809 N Tamiami Trl","city":"Sarasota","state":"FL"},{"name":"Sarasota Municipal Auditorium","type":"City Park","lat":27.342915,"lon":-82.546801,"street":"801 N Tamiami Trl","city":"Sarasota","state":"FL"},{"name":"Senator Bob Johnson's Landing","type":"Water Access","lat":27.043731,"lon":-82.296328,"street":"9083 S Tamiami Trl","city":"Venice","state":"FL"},{"name":"Service Club Park","type":"Beach","lat":27.078809,"lon":-82.451144,"street":"1190 Harbor Dr S","city":"Venice","state":"FL"},{"name":"Shamrock Park","type":"Natural Area","lat":27.053687,"lon":-82.435874,"street":"3900 Shamrock Dr","city":"Venice","state":"FL"},{"name":"Siesta Beach","type":"Beach","lat":27.265977,"lon":-82.549885,"street":"948 Beach Rd","city":"Sarasota","state":"FL"},{"name":"Snook Haven Park","type":"Water Access","lat":27.100118,"lon":-82.333931,"street":"5000 E Venice Ave","city":"Venice","state":"FL"},{"name":"South Brohard Park","type":"Beach","lat":27.068000,"lon":-82.448884,"street":"1900 Harbor Drive S","city":"Venice","state":"FL"},{"name":"Tatum Ridge Soccer Complex","type":"Athletic Facility","lat":27.32738,"lon":-82.42065,"street":"4100 Tatum Rd","city":"Sarasota","state":"FL"},{"name":"Ted Sperling Park at South Lido Beach","type":"Beach","lat":27.305493,"lon":-82.570564,"street":"2201 Benjamin Franklin Dr","city":"Sarasota","state":"FL"},{"name":"Ted Sperling Park at South Lido Beach","type":"Beach","lat":27.309332,"lon":-82.569505,"street":"190 Taft Dr","city":"Sarasota","state":"FL"},{"name":"Tony Saprito Pier","type":"City Park","lat":27.334025,"lon":-82.553605,"street":"920 John Ringling Cswy","city":"Sarasota","state":"FL"},{"name":"Turtle Beach Campground","type":"Beach","lat":27.220445,"lon":-82.51579,"street":"8862 Midnight Pass Road","city":"Sarasota","state":"FL"},{"name":"Turtle Beach Park","type":"Beach","lat":27.219004,"lon":-82.515294,"street":"8918 Midnight Pass Rd","city":"Sarasota","state":"FL"},{"name":"Twin Lakes Park","type":"Athletic Facility","lat":27.26903,"lon":-82.43847,"street":"6700 Clark Rd","city":"Sarasota","state":"FL"},{"name":"Urfer Family Park","type":"Neighborhood and Community","lat":27.283958,"lon":-82.46452,"street":"4012 Honore Ave","city":"Sarasota","state":"FL"},{"name":"Venetian Waterway Park","type":"Trail","lat":27.103139,"lon":-82.445398,"street":"200 N Tamiami Trail","city":"Venice","state":"FL"},{"name":"Venice Beach","type":"Beach","lat":27.099925,"lon":-82.460304,"street":"101 The Esplanade","city":"Venice","state":"FL"},{"name":"Venice Community Center","type":"Recreation Center","lat":27.095151,"lon":-82.446943,"street":"326 S Nokomis Ave","city":"Venice","state":"FL"},{"name":"Venice Myakka River Park","type":"Water Access","lat":27.125492,"lon":-82.435147,"street":"7501 Laurel Rd E","city":"Nokomis","state":"FL"},{"name":"Venice Train Depot and Rollins W. Coakley Railroad Park","type":"Neighborhood and Community","lat":27.100177,"lon":-82.442090,"street":"303 E Venice Ave.","city":"Sarasota","state":"FL"},{"name":"Warm Mineral Springs","type":"City Park","lat":27.058464,"lon":-82.261388,"street":"12220 San Servando Ave","city":"North Port","state":"FL"},{"name":"Wellfield Park","type":"Athletic Facility","lat":27.101979,"lon":-82.4137,"street":"1300 Ridgewood Ave","city":"Venice","state":"FL"},{"name":"Whitaker Gateway Park","type":"City Park","lat":27.350533,"lon":-82.548695,"street":"1445 N Tamiami Trl","city":"Sarasota","state":"FL"},{"name":"Woodmere Park","type":"Recreation Center","lat":27.05577,"lon":-82.39665,"street":"3951 Woodmere Park Blvd","city":"Venice","state":"FL"},{"name":"Youth Athletic Complex","type":"Athletic Facility","lat":27.349613,"lon":-82.512917,"street":"2810 17th St","city":"Sarasota","state":"FL"}]);

const filterBtn = document.querySelector('.filter-btn');
const sortBtn = document.querySelector('.sort-btn');
const resetBtn = document.querySelector('.reset-btn');

filterBtn.addEventListener('click', filterBtnHandler);
sortBtn.addEventListener('click', sortBtnHandler);
resetBtn.addEventListener('click', resetBtnHandler);