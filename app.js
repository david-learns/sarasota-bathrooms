/**
 * 
 */

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

const { filterBtnHandler, sortBtnHandler, clearBtnHandler } = (oParks => {

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
            const html = `
                <li class="common">
                    <h3 class="name">${park.name}</h3><span class="apprx-dist">${park.dist ? ' ~'.concat(Math.round(park.dist * 10) / 10, ' mi ', `<div class="arrow" style="transform: rotate(${-Math.trunc(park.deg)}deg);">&#8594</div>`) : ''}</span>
                    <hr>
                    <h4>${park.type}</h4>
                    <hr>
                    <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(park.addr)}" target="_blank">${park.addr}</a></p>
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

            const { filterDistanceBtnHandler, filterCityBtnHandler, filterTypeBtnHandler } = (() => {

                const filterBtnCats = () => {
                    const cityObj = {};
                    const typeObj = {};
                    filteredParks.forEach(park => {
                        const city = park.addr.slice(park.addr.indexOf(',') + 2, park.addr.lastIndexOf(','));
                        const type = park.type.slice(6);
                        if (!cityObj[city]) cityObj[city] = true;
                        if (!typeObj[type]) typeObj[type] = true;
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

                const filterTypeModal = document.querySelector('.filter-type-modal');
                const filterCityModal = document.querySelector('.filter-city-modal');

                let filterByCity = {};
                let filterByType = {};
                              
                return {

                    filterTypeBtnHandler() {

                        renderFilterBtns(document.querySelector('.filter-type-modal .modal-controls'), 'types');

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

                            const types = Object.keys(filterByType);
                            const numResults = filteredParks.filter(park => {
                                return types.includes(park.type.slice(6));
                            }).length;
                            filterNum.textContent = `${numResults} results`;
                        };

                        const closeModal = () => {
                            filterByType = {};
                            for (const btn of filterByTypeBtns) {
                                btn.remove();
                            }
                            filterTypeCancelBtn.removeEventListener('click', cancelModal);
                            filterTypeOkBtn.removeEventListener('click', closeModal);
                            filterTypeModal.close();
                        };

                        const cancelModal = () => {
                            closeModal();
                        };

                        const okModal = () => {
                            const types = Object.keys(filterByType);
                            filteredParks = filteredParks.filter(park => {
                                return types.includes(park.type.slice(6));
                            });
                            closeModal();
                        };

                        filterTypeCancelBtn.addEventListener('click', cancelModal);
                        filterTypeOkBtn.addEventListener('click', okModal);
                        filterByTypeBtns.forEach(btn => {
                            btn.addEventListener('click', filterByTypeBtnHandler);
                        });

                    },

                    filterCityBtnHandler() {
                        
                        renderFilterBtns(document.querySelector('.filter-city-modal .modal-controls'), 'cities');

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
                            
                            const cities = Object.keys(filterByCity);
                            const numResults = filteredParks.filter(park => {
                                return cities.includes(park.addr.slice(park.addr.indexOf(',') + 2, park.addr.lastIndexOf(',')));
                            }).length;
                            filterNum.textContent = `${numResults} results`;
                        };

                        const closeModal = () => {
                            filterByCity = {};
                            for (const btn of filterByCityBtns) {
                                btn.remove();
                            }
                            filterCityCancelBtn.removeEventListener('click', cancelModal);
                            filterCityOkBtn.removeEventListener('click', closeModal);
                            filterCityModal.close();
                        };

                        const cancelModal = () => {
                            closeModal();
                        };

                        const okModal = () => {
                            const cities = Object.keys(filterByCity);
                            filteredParks = filteredParks.filter(park => {
                                return cities.includes(park.addr.slice(park.addr.indexOf(',') + 2, park.addr.lastIndexOf(',')));
                            });
                            closeModal();
                        };

                        filterCityCancelBtn.addEventListener('click', cancelModal);
                        filterCityOkBtn.addEventListener('click', okModal);
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
            
            const closeModal = () => {
                filterCancelBtn.removeEventListener('click', closeModal);
                filterOkBtn.removeEventListener('click', okModal);
                filterCityBtn.removeEventListener('click', filterCityBtnHandler);
                filterTypeBtn.removeEventListener('click', filterTypeBtnHandler);
                filterModal.close();
            };
            
            const okModal = () => {
                parks = filteredParks;
                populateListItems(parks);
                closeModal();
            }

            filterCancelBtn.addEventListener('click', closeModal);
            filterOkBtn.addEventListener('click', okModal);
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

            const sortBtnHandler = (event = {target: null}) => {
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

            const sortDist = o => {
                const cmpFn = o === 1 ? (a, b) => a.dist - b.dist : (a, b) => b.dist - a.dist;
                if (hasGeol) {
                    setParkDD(() => {
                        parks.sort(cmpFn);
                        populateListItems(parks);
                    });
                } else {
                    alert('this web app needs access to gps to function properly');
                }
            };
            
            const sortType = o => {
                const ord = o === 1 ? {lt: -1, gt: 1} : {lt: 1, gt: -1};
                parks.sort((a, b) => {
                    const aType = a.type;
                    const bType = b.type;
                    if (aType < bType) return ord.lt;
                    if (aType > bType) return ord.gt;
                    return 0;
                });
                populateListItems(parks);
            };
            
            const sortCity = o => {
                const ord = o === 1 ? {lt: -1, gt: 1} : {lt: 1, gt: -1};
                parks.sort((a, b) => {
                    const aCity = a.addr.slice(a.addr.indexOf(',') + 2);
                    const bCity = b.addr.slice(b.addr.indexOf(',') + 2);
                    if (aCity < bCity) return ord.lt;
                    if (aCity > bCity) return ord.gt;
                    return 0;
                });                
                populateListItems(parks);
            };

            const sortCancelBtn = document.querySelector('.sort-cancel-btn');
            const sortOkBtn = document.querySelector('.sort-ok-btn');
            const sortDistanceBtn = document.querySelector('.sort-distance');
            const sortCityBtn = document.querySelector('.sort-city');
            const sortTypeBtn = document.querySelector('.sort-type');

            const closeModal = () => {
                sortBtnHandler();
                sortTypeBtn.removeEventListener('click', sortBtnHandler);
                sortCityBtn.removeEventListener('click', sortBtnHandler);
                sortDistanceBtn.removeEventListener('click', sortBtnHandler);
                sortCancelBtn.removeEventListener('click', closeModal);
                sortOkBtn.removeEventListener('click', sortOkBtnHandler);
                sortModal.close();
            };

            const sortOkBtnHandler = () => {
                if (order.some(e => e !== 0)) {
                    const i = order.findIndex(e => e !== 0);
                    const sortBy = sortByBtns[i].classList[0];
                    if (sortBy === 'sort-type') {
                        sortType(order[i]);
                    } else if (sortBy === 'sort-city') {
                        sortCity(order[i]);
                    } else if (sortBy === 'sort-distance') {
                        sortDist(order[i]);
                    }
                }
                closeModal();
            }
        
            sortOkBtn.addEventListener('click', sortOkBtnHandler);
            sortCancelBtn.addEventListener('click', closeModal);
            sortDistanceBtn.addEventListener('click', sortBtnHandler);
            sortCityBtn.addEventListener('click', sortBtnHandler);
            sortTypeBtn.addEventListener('click', sortBtnHandler);

        },

        clearBtnHandler() {
            parks = [...oParks];
            populateListItems(parks);
        },

    }

})([{"name":"A.B. Smith Park","type":"Type: City Park","addr":"2110 Adams Ln, Sarasota, FL","lat":27.331695,"lon":-82.527783},{"name":"Alligator Creek Conservation and Recreation Area","type":"Type: Natural Area","addr":"702 Venice East Blvd, Venice, FL","lat":27.07169,"lon":-82.381193},{"name":"Arlington Park and Aquatic Center","type":"Type: City Park","addr":"2650 Waldemere St, Sarasota, FL","lat":27.319592,"lon":-82.517348},{"name":"Atwater Community Park","type":"Type: City Park","addr":"4475 Skyway Ave, North Port, FL","lat":27.076501,"lon":-82.161491},{"name":"Babe Ruth Park","type":"Type: Athletic Facility","addr":"185 S Pompano Ave, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Bay Street Park","type":"Type: Neighborhood and Community","addr":"300 Bay St, Osprey, FL","lat":27.196726,"lon":-82.485814},{"name":"Bayfront Community Center","type":"Type: City Park","addr":"803 N Tamiami Trl, Sarasota, FL","lat":27.343318,"lon":-82.547829},{"name":"Bayfront Park","type":"Type: City Park","addr":"4052 Gulf of Mexico Dr, Longboat Key, FL","lat":27.388111,"lon":-82.63974},{"name":"Bayfront Park Addition","type":"Type: Water Access","addr":"4000 Gulf of Mexico Dr, Longboat Key, FL","lat":27.387281,"lon":-82.639779},{"name":"Bee Ridge Park","type":"Type: Athletic Facility","addr":"4430 S Lockwood Ridge Rd, Sarasota, FL","lat":27.290901,"lon":-82.50586},{"name":"Blackburn Point Park","type":"Type: Water Access","addr":"800 Blackburn Point Rd, Osprey, FL","lat":27.180649,"lon":-82.495379},{"name":"Blackburn Point Park","type":"Type: Water Access","addr":"421 Blacburn Point Rd, Osprey, FL","lat":27.191859,"lon":-82.479617},{"name":"Blalock Park","type":"Type: City Park","addr":"300 Nokomis Ave S, Venice, FL","lat":27.09613,"lon":-82.44544},{"name":"Blind Pass Beach Park","type":"Type: Beach","addr":"6725 Manasota Key Rd, Englewood, FL","lat":26.964472,"lon":-82.386051},{"name":"Blue Ridge Park","type":"Type: City Park","addr":"2155 Ridgewood Dr, North Port, FL","lat":27.059914,"lon":-82.204568},{"name":"Bobby Jones Golf Club","type":"Type: City Park","addr":"1000 Circus Blvd, Sarasota, FL","lat":27.351161,"lon":-82.488107},{"name":"Buchan Airport Community Park / Kiwanis Foundation Park","type":"Type: Neighborhood and Community","addr":"1390 Old Englewood Rd, Englewood, FL","lat":26.989144,"lon":-82.373182},{"name":"Butler Park","type":"Type: City Park","addr":"6203 W Price Blvd, North Port, FL","lat":27.076501,"lon":-82.161491},{"name":"Bypass Park - Foxworthy Campus","type":"Type: Athletic Facility","addr":"1101 Gulf Coast Blvd, Venice, FL","lat":27.092236,"lon":-82.427864},{"name":"Carlton Reserve","type":"Type: Natural Area","addr":"1800 Mabry Carlton Pkwy, Venice, FL","lat":27.128657,"lon":-82.332306},{"name":"Caspersen Beach Park","type":"Type: Beach","addr":"4100 Harbor Drive S, Venice, FL","lat":27.137915,"lon":-82.391823},{"name":"Celery Fields Regional Stormwater Facility","type":"Type: Natural Area","addr":"6893 Palmer Blvd, Sarasota, FL","lat":27.325636,"lon":-82.433833},{"name":"Centennial Park","type":"Type: Water Access","addr":"1059 N Tamiami Trl, Sarasota, FL","lat":27.346395,"lon":-82.548023},{"name":"Centennial Park","type":"Type: City Park","addr":"200 W Venice Ave, Venice, FL","lat":27.100362,"lon":-82.446554},{"name":"Chuck Reiter Park","type":"Type: Athletic Facility","addr":"250 Fort St, Venice, FL","lat":27.082819,"lon":-82.441641},{"name":"Colonial Oaks Park","type":"Type: Recreation Center","addr":"5300 Colonial Oaks Blvd, Sarasota, FL","lat":27.31194,"lon":-82.46394},{"name":"Dallas White Park","type":"Type: City Park","addr":"5900 Greenwood Ave, North Port, FL","lat":27.076501,"lon":-82.161491},{"name":"Dr. Martin Luther King Jr. Memorial Park","type":"Type: City Park","addr":"2523 Cocoanut Ave, Sarasota, FL","lat":27.359131,"lon":-82.545837},{"name":"Dr. Martin Luther King Jr. Memorial Park","type":"Type: City Park","addr":"2524 Cocoanut Ave, Sarasota, FL","lat":27.359526,"lon":-82.54458},{"name":"Ed Smith Sports Complex","type":"Type: Athletic Facility","addr":"2700 12th St, Sarasota, FL","lat":27.34861,"lon":-82.51553},{"name":"Englewood Park ","type":"Type: Neighborhood and Community","addr":"101 N Orange St, Englewood, FL","lat":26.964498,"lon":-82.359931},{"name":"Englewood Sports Complex","type":"Type: Athletic Facility","addr":"1300 S River Rd, Englewood, FL","lat":26.97204,"lon":-82.32498},{"name":"Fruitville Park","type":"Type: Athletic Facility","addr":"5151 Richardson Rd, Sarasota, FL","lat":27.343181,"lon":-82.467706},{"name":"Garden of the Five Senses Park","type":"Type: City Park","addr":"4299 Pan American Blvd, North Port, FL","lat":27.055508,"lon":-82.240928},{"name":"George Mullen Activity Center","type":"Type: City Park","addr":"1602 Kramer Way, North Port, FL","lat":27.073974,"lon":-82.204779},{"name":"Glebe Park","type":"Type: Athletic Facility","addr":"1000 Glebe Ln, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Hart's Landing","type":"Type: City Park","addr":"920 John Ringling Cswy, Sarasota, FL","lat":27.334025,"lon":-82.553605},{"name":"Hecksher Park","type":"Type: Neighborhood and Community","addr":"450 W Venice Ave, Venice, FL","lat":27.100517,"lon":-82.451111},{"name":"Higel Marine Park","type":"Type: Water Access","addr":"1250 Tarpon Center Dr, Venice, FL","lat":27.137915,"lon":-82.391823},{"name":"Highland Ridge Park","type":"Type: City Park","addr":"6225 Kenwood Dr, North Port, FL","lat":27.036321,"lon":-82.240971},{"name":"Humphris Park. South Jetty","type":"Type: City Park","addr":"2000 Tarpon Center Dr, Venice, FL","lat":27.112225,"lon":-82.466109},{"name":"Indian Mound Park","type":"Type: Water Access","addr":"210 Winson Ave, Englewood, FL","lat":26.956929,"lon":-82.362747},{"name":"Ken Thompson Park","type":"Type: City Park","addr":"1700 Ken Thompson Pkwy, Sarasota, FL","lat":27.334958,"lon":-82.574969},{"name":"Knight Trail Park","type":"Type: Athletic Facility","addr":"3445 Rustic Rd, Nokomis, FL","lat":27.15937,"lon":-82.40925},{"name":"Lakeview Park","type":"Type: Neighborhood and Community","addr":"7255 Hand Rd, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Larry Thoennissen Athletic Fields","type":"Type: City Park","addr":"1602 Kramer Way, North Port, FL","lat":27.073974,"lon":-82.204779},{"name":"Laurel Park and Sandra Sims Terry Community Center","type":"Type: Recreation Center","addr":"509 Collins Rd, Nokomis, FL","lat":27.13429,"lon":-82.450376},{"name":"Legacy Park","type":"Type: Neighborhood and Community","addr":"395 E Venice Ave, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Culverhouse Nature Park","type":"Type: Trail","addr":"7301 McIntosh Rd, Sarasota, FL","lat":27.249368,"lon":-82.475324},{"name":"Legacy Trail","type":"Type: Trail","addr":"303 E Venice Ave, Venice, FL","lat":27.100757,"lon":-82.440152},{"name":"Lemon Bay Park","type":"Type: Natural Area","addr":"570 Bay Park Blvd, Englewood, FL","lat":26.973002,"lon":-82.37437},{"name":"Lido Beach","type":"Type: Beach","addr":"400 Benjamin Franklin Dr, Sarasota, FL","lat":27.31276,"lon":-82.57704},{"name":"Lincer Preserve","type":"Type: Natural Area","addr":"12600 Border Rd, North Port, FL","lat":27.076501,"lon":-82.161491},{"name":"Locklear Park","type":"Type: Neighborhood and Community","addr":"821 S Lockwood Ridge Rd, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Longboat Key Tennis Center","type":"Type: City Park","addr":"590 Bay Isles Rd, Longboat Key, FL","lat":27.370008,"lon":-82.624529},{"name":"Longwood Park","type":"Type: Recreation Center","addr":"6050 Longwood Run Blvd, Sarasota, FL","lat":27.386356,"lon":-82.481564},{"name":"Luke Wood Park North","type":"Type: City Park","addr":"1851 Mound St, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Luke Wood Park South","type":"Type: City Park","addr":"1850 Mound St, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Manasota Beach Park","type":"Type: Beach","addr":"8570 Manasota Key Rd, Englewood, FL","lat":27.010748,"lon":-82.412429},{"name":"Maxine Barritt Park","type":"Type: Beach","addr":"1800 Harbor Dr S, Venice, FL","lat":27.137915,"lon":-82.391823},{"name":"Miss Sarasota Softball Complex","type":"Type: Athletic Facility","addr":"4770 17th St, Sarasota, FL","lat":27.348761,"lon":-82.473625},{"name":"Morgan Family Community Center","type":"Type: City Park","addr":"6207 W Price Blvd, North Port, FL","lat":27.068399,"lon":-82.224707},{"name":"Myakka River State Park","type":"Type: State Land","addr":"13207 State Road 72, Sarasota, FL","lat":27.234486,"lon":-82.311204},{"name":"Myakkahatchee Creek Environmental Park","type":"Type: City Park","addr":"6968 Reisterstown Rd, North Port, FL","lat":27.113062,"lon":-82.205949},{"name":"Narramore Sports Complex","type":"Type: City Park","addr":"7508 Glenallen Blvd, North Port, FL","lat":27.073381,"lon":-82.23849},{"name":"Nathan Benderson Park","type":"Type: Athletic Facility","addr":"5851 Nathan Benderson Cir, Sarasota, FL","lat":27.376034,"lon":-82.452265},{"name":"Newtown Estates Park","type":"Type: Recreation Center","addr":"2800 Newtown Blvd, Sarasota, FL","lat":27.360924,"lon":-82.523406},{"name":"Nokomis Beach Park","type":"Type: Beach","addr":"100 Casey Key Rd, Nokomis, FL","lat":27.12446,"lon":-82.47026},{"name":"Nokomis Community Park","type":"Type: Recreation Center","addr":"234 Nippino Trl E, Nokomis, FL","lat":27.117743,"lon":-82.446885},{"name":"North Brohard Park","type":"Type: Beach","addr":"1400 Harbor Dr S, Venice, FL","lat":27.074703,"lon":-82.450821},{"name":"North Jetty Park","type":"Type: Beach","addr":"1000 S Casey Key Rd, Nokomis, FL","lat":27.11609,"lon":-82.46716},{"name":"North Port Scout House","type":"Type: City Park","addr":"5845 Greenwood Ave, North Port, FL","lat":27.076501,"lon":-82.161491},{"name":"North Port Skate Park","type":"Type: City Park","addr":"5651 North Port Blvd, North Port, FL","lat":27.047149,"lon":-82.23523},{"name":"Oscar Scherer State Park","type":"Type: State Land","addr":"1843 S Tamiami Trl, Osprey, FL","lat":27.16923,"lon":-82.47754},{"name":"Patriots Park","type":"Type: Neighborhood and Community","addr":"800 Venetia Bay Blvd, Venice, FL","lat":27.110582,"lon":-82.444204},{"name":"Payne Park","type":"Type: City Park","addr":"2110 Adams Ln, Sarasota, FL","lat":27.331695,"lon":-82.527783},{"name":"Payne Park Tennis Center","type":"Type: City Park","addr":"2050 Adams Lane, Sarasota, FL","lat":27.334591,"lon":-82.529609},{"name":"Phillippi Estate Park","type":"Type: Recreation Center","addr":"5500 S Tamiami Trl, Sarasota, FL","lat":27.27272,"lon":-82.53072},{"name":"Pine View School - Athletic Court Facilities","type":"Type: Athletic Facility","addr":"1 Python Path, Osprey, FL","lat":27.187609,"lon":-82.478977},{"name":"Pinebrook Park","type":"Type: Athletic Facility","addr":"1251 Pinebrook Rd, Venice, FL","lat":27.108244,"lon":-82.415224},{"name":"Pinecraft Park","type":"Type: Neighborhood and Community","addr":"1420 Gilbert Ave, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Red Bug Slough Preserve","type":"Type: Natural Area","addr":"5200 Beneva Rd, Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Red Rock Park","type":"Type: Neighborhood and Community","addr":"3987 Camino Real, Sarasota, FL","lat":27.297615,"lon":-82.536723},{"name":"Robert L. Taylor Community Complex","type":"Type: City Park","addr":"1845 34th St, Sarasota, FL","lat":27.36564,"lon":-82.533943},{"name":"Rothenbach Park","type":"Type: Neighborhood and Community","addr":"8650 Bee Ridge Rd, Sarasota, FL","lat":27.295706,"lon":-82.397246},{"name":"Sarasota Lawn Bowling","type":"Type: City Park","addr":"809 N Tamiami Trl, Sarasota, FL","lat":27.343998,"lon":-82.547486},{"name":"Sarasota Municipal Auditorium","type":"Type: City Park","addr":"801 N Tamiami Trl, Sarasota, FL","lat":27.342915,"lon":-82.546801},{"name":"Senator Bob Johnson's Landing","type":"Type: Water Access","addr":"9083 S Tamiami Trl, Venice, FL","lat":27.043731,"lon":-82.296328},{"name":"Service Club Park","type":"Type: Beach","addr":"1190 Harbor Dr S, Venice, FL","lat":27.078809,"lon":-82.451144},{"name":"Shamrock Park","type":"Type: Natural Area","addr":"3900 Shamrock Dr, Venice, FL","lat":27.053687,"lon":-82.435874},{"name":"Siesta Beach","type":"Type: Beach","addr":"948 Beach Rd, Sarasota, FL","lat":27.265977,"lon":-82.549885},{"name":"Snook Haven Park","type":"Type: Water Access","addr":"5000 E Venice Ave, Venice, FL","lat":27.100118,"lon":-82.333931},{"name":"South Brohard Park","type":"Type: Beach","addr":"1900 Harbor Drive S, Venice, FL","lat":27.137915,"lon":-82.391823},{"name":"Tatum Ridge Soccer Complex","type":"Type: Athletic Facility","addr":"4100 Tatum Rd, Sarasota, FL","lat":27.32738,"lon":-82.42065},{"name":"Ted Sperling Park at South Lido Beach","type":"Type: Beach","addr":"2201 Benjamin Franklin Dr, Sarasota, FL","lat":27.305493,"lon":-82.570564},{"name":"Ted Sperling Park at South Lido Beach","type":"Type: Beach","addr":"190 Taft Dr, Sarasota, FL","lat":27.309332,"lon":-82.569505},{"name":"Tony Saprito Pier","type":"Type: City Park","addr":"920 John Ringling Cswy, Sarasota, FL","lat":27.334025,"lon":-82.553605},{"name":"Turtle Beach Campground","type":"Type: Beach","addr":"8862 Midnight Pass Road, Sarasota, FL","lat":27.220445,"lon":-82.51579},{"name":"Turtle Beach Park","type":"Type: Beach","addr":"8918 Midnight Pass Rd, Sarasota, FL","lat":27.219004,"lon":-82.515294},{"name":"Twin Lakes Park","type":"Type: Athletic Facility","addr":"6700 Clark Rd, Sarasota, FL","lat":27.26903,"lon":-82.43847},{"name":"Urfer Family Park","type":"Type: Neighborhood and Community","addr":"4012 Honore Ave, Sarasota, FL","lat":27.283958,"lon":-82.46452},{"name":"Venetian Waterway Park","type":"Type: Trail","addr":"301 E Venice Ave, Venice, FL","lat":27.137915,"lon":-82.391823},{"name":"Venice Beach","type":"Type: Beach","addr":"101 The Esplanade, Venice, FL","lat":27.099925,"lon":-82.460304},{"name":"Venice Community Center","type":"Type: Recreation Center","addr":"326 S Nokomis Ave, Venice, FL","lat":27.095151,"lon":-82.446943},{"name":"Venice Myakka River Park","type":"Type: Water Access","addr":"7501 Laurel Rd E, Nokomis, FL","lat":27.125492,"lon":-82.435147},{"name":"Venice Train Depot and Rollins W. Coakley Railroad Park","type":"Type: Neighborhood and Community","addr":"303 E Venice Ave., Sarasota, FL","lat":27.331803,"lon":-82.549852},{"name":"Warm Mineral Springs","type":"Type: City Park","addr":"12220 San Servando Ave, North Port, FL","lat":27.058464,"lon":-82.261388},{"name":"Wellfield Park","type":"Type: Athletic Facility","addr":"1300 Ridgewood Ave, Venice, FL","lat":27.101979,"lon":-82.4137},{"name":"Whitaker Gateway Park","type":"Type: City Park","addr":"1445 N Tamiami Trl, Sarasota, FL","lat":27.350533,"lon":-82.548695},{"name":"Woodmere Park","type":"Type: Recreation Center","addr":"3951 Woodmere Park Blvd, Venice, FL","lat":27.05577,"lon":-82.39665},{"name":"Youth Athletic Complex","type":"Type: Athletic Facility","addr":"2810 17th St, Sarasota, FL","lat":27.349613,"lon":-82.512917}]);

const filterBtn = document.querySelector('.filter-btn');
const sortBtn = document.querySelector('.sort-btn');
const resetBtn = document.querySelector('.reset-btn');

filterBtn.addEventListener('click', filterBtnHandler);
sortBtn.addEventListener('click', sortBtnHandler);
resetBtn.addEventListener('click', clearBtnHandler);