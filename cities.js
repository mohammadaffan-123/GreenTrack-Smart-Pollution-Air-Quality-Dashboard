const INDIAN_CITIES = [
  // Delhi NCR  
  'Delhi','New Delhi','Noida','Greater Noida','Gurgaon','Faridabad','Ghaziabad','Rohini','Dwarka',
  'Shahdara','Najafgarh','Narela','Janakpuri','Vasant Kunj','Saket',
  // Maharashtra
  'Mumbai','Pune','Nagpur','Nashik','Aurangabad','Thane','Solapur','Kolhapur','Navi Mumbai','Amravati',
  'Akola','Latur','Dhule','Ahmednagar','Chandrapur','Palghar','Bhiwandi','Jalgaon','Sangli','Malegaon',
  'Kalyan','Vasai-Virar','Ulhasnagar','Mira-Bhayandar','Panvel','Wardha','Yavatmal','Nanded','Parbhani',
  'Ichalkaranji','Jalna','Ambajogai','Beed','Gondia','Satara','Barshi','Osmanabad','Ratnagiri','Hingoli','Hinganghat',
  // Karnataka
  'Bengaluru','Mysuru','Mangaluru','Hubballi','Belagavi','Davanagere','Bellary','Tumkur',
  'Shimoga','Raichur','Bidar','Hospet','Gadag','Udupi','Kolar','Mandya','Hassan','Chitradurga',
  'Bagalkot','Dharwad','Gulbarga','Karwar','Ranebennur','Bhadravati','Bijapur','Yadgir','Chikmagalur','Robertsonpet',
  // Tamil Nadu
  'Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Vellore','Erode','Thanjavur',
  'Thoothukudi','Nagercoil','Dindigul','Karur','Cuddalore','Kanchipuram','Kumbakonam','Tiruppur','Hosur',
  'Ambur','Pollachi','Pudukkottai','Rajapalayam','Sivakasi','Virudhunagar','Namakkal','Tindivanam',
  'Nagapattinam','Neyveli','Avadi','Tambaram','Pallavaram','Udhagamandalam','Arakkonam',
  // Uttar Pradesh
  'Lucknow','Kanpur','Varanasi','Agra','Allahabad','Meerut','Bareilly','Aligarh','Moradabad','Gorakhpur',
  'Azamgarh','Jhansi','Mathura','Rampur','Shahjahanpur','Firozabad','Saharanpur','Hapur','Etawah','Mirzapur',
  'Bulandshahr','Sambhal','Amroha','Hardoi','Fatehpur','Raebareli','Orai','Sitapur','Bahraich','Unnao',
  'Rae Bareli','Lakhimpur','Banda','Pilibhit','Barabanki','Khurja','Gonda','Mainpuri','Lalitpur','Etah',
  'Deoria','Badaun','Budaun','Muzaffarnagar','Bijnor',
  // Gujarat
  'Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Gandhinagar','Junagadh',
  'Anand','Nadiad','Morbi','Surendranagar','Bharuch','Vapi','Navsari','Veraval','Porbandar','Godhra','Bhuj','Ankleshwar',
  'Mehsana','Patan','Palanpur','Botad','Amreli','Deesa','Jetpur',
  // West Bengal
  'Kolkata','Howrah','Durgapur','Asansol','Siliguri','Kharagpur','Bardhaman','Malda','Baharampur',
  'Habra','Kalyani','Raiganj','Haldia','Krishnanagar','Bankura','Jalpaiguri','Purulia','Medinipur',
  'Darjeeling','Alipurduar','Balurghat','Basirhat','Chandannagar',
  // Rajasthan
  'Jaipur','Jodhpur','Udaipur','Kota','Ajmer','Bikaner','Alwar','Bharatpur','Sikar','Bhilwara',
  'Pali','Tonk','Kishangarh','Beawar','Hanumangarh','Sri Ganganagar','Jhunjhunu','Churu','Banswara',
  'Bundi','Chittorgarh','Dungarpur','Jaisalmer','Jhalawar','Nagaur','Sawai Madhopur',
  // Telangana
  'Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Mahbubnagar','Nalgonda','Adilabad','Suryapet','Miryalaguda',
  'Ramagundam','Secunderabad','Jagtial','Mancherial','Nirmal','Kamareddy','Siddipet','Bhongir','Sangareddy','Medak',
  'Vikarabad','Jangaon','Wanaparthy',
  // Andhra Pradesh
  'Visakhapatnam','Vijayawada','Guntur','Nellore','Tirupati','Rajahmundry','Kakinada','Kurnool','Anantapur',
  'Eluru','Ongole','Kadapa','Chittoor','Vizianagaram','Machilipatnam','Srikakulam','Adoni','Tenali','Proddatur',
  'Nandyal','Hindupur','Bhimavaram','Madanapalle','Guntakal','Dharmavaram','Gudivada','Narasaraopet',
  'Tadepalligudem','Tadipatri','Chilakaluripet',
  // Kerala
  'Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Kannur','Alappuzha','Palakkad','Malappuram',
  'Kottayam','Pathanamthitta','Idukki','Kasaragod','Wayanad','Ernakulam','Thalassery','Ponnani','Vatakara',
  'Kanhangad','Payyanur','Koyilandy','Mattannur','Punalur','Nilambur','Cherthala','Changanassery','Tirur',
  'Kodungallur','Neyyattinkara','Kayamkulam',
  // Punjab
  'Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Hoshiarpur','Pathankot','Moga',
  'Abohar','Malerkotla','Khanna','Phagwara','Muktsar','Barnala','Firozpur','Kapurthala','Faridkot','Rajpura',
  'Sangrur','Fazilka','Gurdaspur','Kharar','Gobindgarh','Mansa','Malout','Nabha','Tarn Taran','Jagraon','Sunam',
  // Haryana
  'Chandigarh','Faridabad','Gurgaon','Panipat','Ambala','Karnal','Rohtak','Hisar','Sonipat',
  'Panchkula','Yamunanagar','Bhiwani','Sirsa','Bahadurgarh','Jind','Thanesar','Kaithal','Rewari','Palwal',
  'Hansi','Narnaul','Fatehabad','Gohana','Tohana','Narwana',
  // Madhya Pradesh
  'Indore','Bhopal','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Ratlam','Rewa',
  'Katni','Singrauli','Burhanpur','Khandwa','Morena','Bhind','Chhindwara','Guna','Shivpuri','Vidisha',
  'Damoh','Mandsaur','Khargone','Neemuch','Pithampur','Hoshangabad','Seoni','Shahdol','Betul','Dhar',
  'Sehore','Balaghat',
  // Bihar
  'Patna','Gaya','Bhagalpur','Muzaffarpur','Darbhanga','Purnia','Arrah','Begusarai','Katihar',
  'Munger','Chhapra','Danapur','Bettiah','Saharsa','Hajipur','Sasaram','Dehri','Siwan','Motihari',
  'Nawada','Bagaha','Buxar','Kishanganj','Sitamarhi','Jamalpur','Jehanabad','Aurangabad','Madhubani',
  'Bhabua','Samastipur',
  // Odisha
  'Bhubaneswar','Cuttack','Rourkela','Brahmapur','Sambalpur','Puri','Balasore','Baripada','Bhadrak','Jharsuguda',
  'Jeypore','Bargarh','Kendujhar','Sunabeda','Rayagada','Paradip','Angul','Talcher','Bhawanipatna','Balangir',
  'Titlagarh','Nabarangpur','Jajpur','Dhenkanal',
  // Assam
  'Guwahati','Dibrugarh','Jorhat','Silchar','Nagaon','Tezpur','Tinsukia','Bongaigaon','Diphu','Dhubri',
  'Goalpara','Barpeta','Golaghat','Sivasagar','Hojai','North Lakhimpur','Karimganj','Haflong','Mangaldoi',
  'Nalbari','Kokrajhar',
  // Jharkhand
  'Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Phusro','Hazaribagh','Giridih','Ramgarh','Medininagar',
  'Chaibasa','Chirkunda','Dumka','Sahibganj','Pakur','Gumla','Mihijam','Jhumri Tilaiya','Chatra','Koderma',
  'Lohardaga','Daltonganj',
  // Chhattisgarh
  'Raipur','Bhilai','Bilaspur','Korba','Durg','Rajnandgaon','Jagdalpur','Raigarh','Ambikapur','Mahasamund',
  'Dhamtari','Chirmiri','Bhatapara','Dalli-Rajhara','Naila Janjgir','Tilda Newra','Mungeli','Manendragarh','Sakti',
  // Uttarakhand
  'Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Kashipur','Rishikesh','Nainital','Pithoragarh','Almora',
  'Tehri','Mussoorie','Pauri','Ranikhet','Kotdwar','Jaspur','Sitarganj','Kichha','Manglaur','Tanakpur',
  // Himachal Pradesh
  'Shimla','Dharamshala','Solan','Mandi','Kullu','Manali','Hamirpur','Bilaspur','Palampur','Chamba',
  'Una','Nahan','Sundarnagar','Kangra','Baddi','Parwanoo','Dalhousie','Kinnaur','Keylong',
  // Jammu & Kashmir
  'Srinagar','Jammu','Anantnag','Baramulla','Udhampur','Kathua','Sopore','Pulwama','Budgam','Rajouri',
  'Poonch','Ganderbal','Kupwara','Bandipora','Kulgam','Shopian','Samba','Reasi','Kishtwar','Doda','Ramban',
  // Goa
  'Panaji','Margao','Vasco da Gama','Mapusa','Ponda','Bicholim','Curchorem','Sanquelim','Quepem','Pernem',
  'Cuncolim','Canacona',
  // Puducherry
  'Puducherry','Karaikal','Yanam','Mahe','Ozhukarai',
  // Tripura
  'Agartala','Udaipur','Dharmanagar','Kailasahar','Ambassa','Belonia','Khowai','Teliamura','Kamalpur','Sabroom',
  // Meghalaya
  'Shillong','Tura','Nongstoin','Jowai','Baghmara','Williamnagar','Nongpoh','Mairang',
  // Manipur
  'Imphal','Thoubal','Bishnupur','Churachandpur','Kakching','Ukhrul','Senapati','Tamenglong','Jiribam','Moirang',
  // Nagaland
  'Kohima','Dimapur','Mokokchung','Tuensang','Wokha','Zunheboto','Mon','Phek',
  // Mizoram
  'Aizawl','Lunglei','Champhai','Serchhip','Kolasib','Lawngtlai','Saiha','Mamit',
  // Arunachal Pradesh
  'Itanagar','Naharlagun','Pasighat','Tawang','Ziro','Bomdila','Tezu','Seppa','Along','Roing','Anini','Daporijo','Changlang',
  // Sikkim
  'Gangtok','Namchi','Gyalshing','Mangan','Rangpo','Jorethang','Singtam','Ravangla',
  // Ladakh
  'Leh','Kargil',
  // Andaman & Nicobar
  'Port Blair',
  // Dadra & Nagar Haveli and Daman & Diu
  'Daman','Diu','Silvassa',
  // Lakshadweep
  'Kavaratti'
];

function renderList(items) {
  const list = document.getElementById('cityList');
  list.innerHTML = '';
  items.forEach(city => {
    const div = document.createElement('div');
    div.className = 'pollutant-item';
    div.style.cursor = 'pointer';
    div.innerHTML = `<div class="pollutant-name">${city}</div><div class="pollutant-unit">Open in Dashboard</div>`;
    div.addEventListener('click', () => {
      // Persist choice and navigate
      localStorage.setItem('selectedCity', city);
      const url = `index.html?city=${encodeURIComponent(city)}`;
      window.location.href = url;
    });
    list.appendChild(div);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('citySearch');
  renderList(INDIAN_CITIES);
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    renderList(INDIAN_CITIES.filter(c => c.toLowerCase().includes(q)));
  });
});
