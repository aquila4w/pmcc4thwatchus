import { NextResponse } from "next/server";
import { getPayload } from "payload";
import { headers } from "next/headers";
import config from "@payload-config";

async function getCurrentUser() {
  const payload = await getPayload({ config });
  const headersList = await headers();
  const { user } = await payload.auth({ headers: headersList });
  return user;
}

const SUB_DISTRICTS = [
  { number: 1, name: "Southern California", description: "Sub-District 1 - Southern California" },
  { number: 2, name: "Northern California", description: "Sub-District 2 - Northern California" },
  { number: 3, name: "Central Valley", description: "Sub-District 3 - Central Valley" },
  { number: 4, name: "Northeast", description: "Sub-District 4 - Northeast" },
  { number: 5, name: "Southeast", description: "Sub-District 5 - Southeast" },
  { number: 6, name: "Florida and Great Hispanosphere", description: "Sub-District 6 - Florida and Great Hispanosphere" },
  { number: 7, name: "Southwest", description: "Sub-District 7 - Southwest" },
  { number: 8, name: "Pacific Northwest", description: "Sub-District 8 - Pacific Northwest" },
];

interface ChurchData {
  name: string;
  slug: string;
  address: string;
  email: string;
  phone: string;
  subDistrict: string;
  city: string;
  state: string;
  coordinates: { lat: number; lng: number };
}

const CHURCHES: ChurchData[] = [
  { name: "PMCC (4th Watch) South Bay", slug: "pmcc-4th-watch-south-bay", address: "1019 W 182nd St. Gardena, CA 90248", email: "pmcc4thwatchsouthbay@gmail.com", phone: "(310) 327-1300", subDistrict: "Southern California", city: "Gardena", state: "CA", coordinates: { lat: 33.8674, lng: -118.29096 } },
  { name: "PMCC - 4th Watch of Los Angeles", slug: "pmcc-4th-watch-los-angeles", address: "2804 Beverly Blvd. Los Angeles, Ca 90057", email: "pmcc4thwatchlosangeles@gmail.com", phone: "(650) 758-8916", subDistrict: "Southern California", city: "Los Angeles", state: "CA", coordinates: { lat: 34.070357, lng: -118.279077 } },
  { name: "PMCC 4th Watch of West Covina", slug: "pmcc-4th-watch-west-covina", address: "14461 Merced Av Unit 202, Baldwin Park, CA 91706", email: "pmccwestcovina4w@gmail.com", phone: "(626) 743-1168", subDistrict: "Southern California", city: "Baldwin Park", state: "CA", coordinates: { lat: 34.072694, lng: -117.961186 } },
  { name: "PMCC 4th Watch - Colton, California", slug: "pmcc-4th-watch-colton", address: "225 E. Airport Drive suite 210, San Bernardino, CA 92408", email: "pmcc4wcolton@gmail.com", phone: "(407) 575-7778", subDistrict: "Southern California", city: "San Bernardino", state: "CA", coordinates: { lat: 34.066797, lng: -117.283185 } },
  { name: "PMCC 4th Watch Mira Mesa", slug: "pmcc-4th-watch-mira-mesa", address: "13939 Poway Rd Suite #12 Poway, CA 92064", email: "miramesa.pmcc4w@gmail.com", phone: "(919) 561-7593", subDistrict: "Southern California", city: "Poway", state: "CA", coordinates: { lat: 32.956079, lng: -117.029102 } },
  { name: "PMCC- 4th Watch of Riverside", slug: "pmcc-4th-watch-riverside", address: "6377 Riverside Ave Riverside CA 92506 Room 204", email: "Pmcc4thWatchRiverside@Gmail.com", phone: "(919) 389-4083", subDistrict: "Southern California", city: "Riverside", state: "CA", coordinates: { lat: 33.951533, lng: -117.388359 } },
  { name: "PMCC 4th Watch Fremont", slug: "pmcc-4th-watch-fremont", address: "37600 central court, suite 230, Newark, California 94560", email: "pmcc4thwatchfremont@gmail.com", phone: "(510) 396-9802", subDistrict: "Northern California", city: "Newark", state: "CA", coordinates: { lat: 37.521145, lng: -122.039753 } },
  { name: "PMCC 4th Watch San Francisco", slug: "pmcc-4th-watch-san-francisco", address: "731 Kains Avenue, San Bruno, CA 94066 USA", email: "pmcc4wsf@gmail.com", phone: "(919) 337-8063", subDistrict: "Northern California", city: "San Bruno", state: "CA", coordinates: { lat: 37.627095, lng: -122.41613 } },
  { name: "PMCC 4th Watch - Antioch", slug: "pmcc-4th-watch-antioch", address: "913 Sunset Dr, Antioch, CA 94909", email: "pmcc4wantiochca@gmail.com", phone: "(510) 399-8239", subDistrict: "Northern California", city: "Antioch", state: "CA", coordinates: { lat: 37.998337, lng: -121.792539 } },
  { name: "PMCC 4th Watch Oakland", slug: "pmcc-4th-watch-oakland", address: "2441 San Jose Ave., Alameda CA 94501", email: "pmcc4woakland@gmail.com", phone: "(341) 231-2658", subDistrict: "Northern California", city: "Alameda", state: "CA", coordinates: { lat: 37.760158, lng: -122.243941 } },
  { name: "PMCC 4th Watch - Vallejo", slug: "pmcc-4th-watch-vallejo", address: "2234 Sacramento St., Vallejo, California 94590", email: "pmcc4wvallejo@gmail.com", phone: "(925) 771-4935", subDistrict: "Northern California", city: "Vallejo", state: "CA", coordinates: { lat: 38.121805, lng: -122.261449 } },
  { name: "PMCC 4th Watch Novato", slug: "pmcc-4th-watch-novato", address: "14 Commercial Blvd Suite 115, Novato, CA 94949", email: "pmccnovato4w@gmail.com", phone: "", subDistrict: "Northern California", city: "Novato", state: "CA", coordinates: { lat: 38.06818, lng: -122.531752 } },
  { name: "PMCC 4th Watch of San Jose, California", slug: "pmcc-4th-watch-san-jose", address: "1440 Koll Circle 103 San Jose CA 95112", email: "Pmcc4thwatch.sj@gmail.com", phone: "(669) 294-0140", subDistrict: "Central Valley", city: "San Jose", state: "CA", coordinates: { lat: 37.366013, lng: -121.906384 } },
  { name: "PMCC 4th Watch Fresno", slug: "pmcc-4th-watch-fresno", address: "3223 E Shields Ave., Fresno, CA 93726", email: "pmcc4wfresnoca@gmail.com", phone: "(559) 874-6433", subDistrict: "Central Valley", city: "Fresno", state: "CA", coordinates: { lat: 36.77981, lng: -119.76965 } },
  { name: "PMCC - 4th Watch of Roseville", slug: "pmcc-4th-watch-roseville", address: "5252 Sunrise Blvd. Ste 5 Fair Oaks, CA 95628", email: "Pmcc4wroseville@gmail.com", phone: "(803) 370-1140", subDistrict: "Central Valley", city: "Fair Oaks", state: "CA", coordinates: { lat: 38.66173, lng: -121.271724 } },
  { name: "PMCC 4th Watch of Sacramento", slug: "pmcc-4th-watch-sacramento", address: "2251 Florin Rd Ste 104 Sacramento, CA 95822", email: "pmcc4wsacramento@gmail.com", phone: "(916) 753-4021", subDistrict: "Central Valley", city: "Sacramento", state: "CA", coordinates: { lat: 38.497067, lng: -121.484302 } },
  { name: "PMCC 4th Watch - Stockton", slug: "pmcc-4th-watch-stockton", address: "4422 N Pershing Ave Suite D-8 Stockton, CA 95210", email: "Pmccstockton@gmail.com", phone: "(209) 621-7238", subDistrict: "Central Valley", city: "Stockton", state: "CA", coordinates: { lat: 37.985409, lng: -121.319851 } },
  { name: "PMCC 4th Watch Poplar", slug: "pmcc-4th-watch-poplar", address: "14451 RD 192 Poplar CA 93258", email: "PMCC4WPOPLAR@GMAIL.COM", phone: "(559) 770-2537", subDistrict: "Central Valley", city: "Poplar", state: "CA", coordinates: { lat: 36.052153, lng: -119.143445 } },
  { name: "PMCC 4th Watch - New York", slug: "pmcc-4th-watch-new-york", address: "4021 69th St. Suite A Woodside, NY 11377", email: "pmcc4wnyc2@gmail.com", phone: "(570) 604-6858", subDistrict: "Northeast", city: "Woodside", state: "NY", coordinates: { lat: 40.74566, lng: -73.895966 } },
  { name: "PMCC 4th Watch of Silver Spring", slug: "pmcc-4th-watch-silver-spring", address: "9426 Stewarton Rd, Suite 3A Gaithersburg, MD 20879", email: "pmcc4w.silverspring@gmail.com", phone: "(510) 478-6250", subDistrict: "Northeast", city: "Gaithersburg", state: "MD", coordinates: { lat: 39.172631, lng: -77.162022 } },
  { name: "PMCC 4th Watch - Washington DC/VA", slug: "pmcc-4th-watch-washington-dc", address: "9870 Main St Fairfax VA 22031", email: "pmcc4wdcva@gmail.com", phone: "(509) 951-7353", subDistrict: "Northeast", city: "Fairfax", state: "VA", coordinates: { lat: 38.863828, lng: -77.28598 } },
  { name: "PMCC 4th Watch - Virginia Beach", slug: "pmcc-4th-watch-virginia-beach", address: "5465 Virginia Beach Blvd, Ste H. Virginia Beach VA 23452", email: "pmcc4wvb@gmail.com", phone: "(509) 789-0827", subDistrict: "Northeast", city: "Virginia Beach", state: "VA", coordinates: { lat: 36.850285, lng: -76.170822 } },
  { name: "PMCC 4th Watch - New Jersey", slug: "pmcc-4th-watch-new-jersey", address: "361a Broadway Bayonne, NJ 07002", email: "pmcc4wnj@gmail.com", phone: "(551) 225-0219", subDistrict: "Northeast", city: "Bayonne", state: "NJ", coordinates: { lat: 40.659311, lng: -74.122307 } },
  { name: "PMCC 4th Watch - Chicago/Elgin", slug: "pmcc-4th-watch-chicago", address: "742 Algona Ave. Elgin, IL 60120", email: "Pmcc4wchicago@gmail.com", phone: "(847) 841-3857", subDistrict: "Northeast", city: "Elgin", state: "IL", coordinates: { lat: 42.049875, lng: -88.262349 } },
  { name: "PMCC 4th Watch - Michigan", slug: "pmcc-4th-watch-michigan", address: "15215 E 13 Mile Rd, Fraser, MI 48026", email: "pmcc4wmichigan@gmail.com", phone: "(248) 787-1015", subDistrict: "Northeast", city: "Fraser", state: "MI", coordinates: { lat: 42.52411, lng: -82.968374 } },
  { name: "PMCC 4th Watch - Princeton", slug: "pmcc-4th-watch-princeton", address: "107 S Richland Creek Dr Princeton, IN 47670", email: "pmcc4wprinceton@gmail.com", phone: "(847) 841-3857", subDistrict: "Northeast", city: "Princeton", state: "IN", coordinates: { lat: 38.3542735, lng: -87.5955307 } },
  { name: "PMCC 4th Watch Baltimore", slug: "pmcc-4th-watch-baltimore", address: "2903 Beechwood Lane Fallston, MD 21047", email: "pmccbaltimore4w@gmail.com", phone: "(443) 739-4130", subDistrict: "Southeast", city: "Fallston", state: "MD", coordinates: { lat: 39.4869263, lng: -76.4161064 } },
  { name: "PMCC 4th Watch of North Carolina", slug: "pmcc-4th-watch-north-carolina", address: "3601-121 Capital Blvd Raleigh, North Carolina 27604", email: "edwardeddie91@gmail.com", phone: "(773) 517-1622", subDistrict: "Southeast", city: "Raleigh", state: "NC", coordinates: { lat: 35.8297554, lng: -78.5863195 } },
  { name: "PMCC 4th Watch Atlanta", slug: "pmcc-4th-watch-atlanta", address: "5055 Winters Chapel Road Atlanta GA 30360", email: "atlanta.locale@gmail.com", phone: "(405) 999-8836", subDistrict: "Southeast", city: "Atlanta", state: "GA", coordinates: { lat: 33.9441412, lng: -84.2699562 } },
  { name: "PMCC 4th Watch South Carolina", slug: "pmcc-4th-watch-south-carolina", address: "1449 Ebenezer Rd Rock Hill, SC 29732", email: "pmcc4wsc@gmail.com", phone: "(818) 979-3372", subDistrict: "Southeast", city: "Rock Hill", state: "SC", coordinates: { lat: 34.9506949, lng: -81.0425105 } },
  { name: "PMCC 4th Watch of Orlando, Florida", slug: "pmcc-4th-watch-orlando", address: "525 S Ronald Reagan Blvd Suite 101 Longwood, FL 32750", email: "pmcc4w.orlando@gmail.com", phone: "(310) 940-7605", subDistrict: "Florida and Great Hispanosphere", city: "Longwood", state: "FL", coordinates: { lat: 28.6920857, lng: -81.3453417 } },
  { name: "PMCC 4th Watch of Miami, Florida", slug: "pmcc-4th-watch-miami", address: "16499 NE 19th Ave Suite 216, North Miami Beach, FL 33162", email: "pmcc4w.miami@gmail.com", phone: "(619) 822-4620", subDistrict: "Florida and Great Hispanosphere", city: "North Miami Beach", state: "FL", coordinates: { lat: 25.9280009, lng: -80.1616984 } },
  { name: "PMCC 4th Watch of Tampa, Florida", slug: "pmcc-4th-watch-tampa", address: "104 Seacrest Dr. #6 Largo, FL 33771", email: "pmcc4wtampa@gmail.com", phone: "(310) 800-8991", subDistrict: "Florida and Great Hispanosphere", city: "Largo", state: "FL", coordinates: { lat: 27.9172449, lng: -82.7517826 } },
  { name: "PMCC 4th Watch - Tijuana", slug: "pmcc-4th-watch-tijuana", address: "776 Avenida F Martinez 22000 Tijuana, Mexico", email: "pmcc4thwatch.tijuana@gmail.com", phone: "(949) 302-7939", subDistrict: "Florida and Great Hispanosphere", city: "Tijuana", state: "Mexico", coordinates: { lat: 32.5354467, lng: -117.0416689 } },
  { name: "PMCC 4th Watch - Panama", slug: "pmcc-4th-watch-panama", address: "Av. Vasco Nunez de Balboa, Panama", email: "pmcc4wpanama@gmail.com", phone: "(US) 509 638-8116", subDistrict: "Florida and Great Hispanosphere", city: "Panama City", state: "Panama", coordinates: { lat: 8.9698544, lng: -79.5305933 } },
  { name: "PMCC 4th Watch - Brazil", slug: "pmcc-4th-watch-brazil", address: "Av. Mal. Deodora da Fonseca, 1438 - Centro, Jaragua do Sul - SC, 89251-700", email: "pmcc4w.jaragua.br@gmail.com", phone: "+55 47 8914-0998", subDistrict: "Florida and Great Hispanosphere", city: "Jaragua do Sul", state: "SC", coordinates: { lat: -26.4927596, lng: -49.0856987 } },
  { name: "PMCC 4th Watch - Guatemala", slug: "pmcc-4th-watch-guatemala", address: "28 Calle A 13-25, Zone 13, Colonia Santa Fe", email: "pmcc4w.guatemala@gmail.com", phone: "(+502) 5986-9836", subDistrict: "Florida and Great Hispanosphere", city: "Guatemala City", state: "Guatemala", coordinates: { lat: 14.5651171, lng: -90.5282898 } },
  { name: "PMCC 4th Watch - Kenya", slug: "pmcc-4th-watch-kenya", address: "Maralal, Kenya", email: "pmcc4wkenya@gmail.com", phone: "(408) 607-7755", subDistrict: "Florida and Great Hispanosphere", city: "Maralal", state: "Kenya", coordinates: { lat: 1.0945125, lng: 36.6994219 } },
  { name: "PMCC 4th Watch - Puerto Rico", slug: "pmcc-4th-watch-puerto-rico", address: "55 Calle Esteban Padilla Suite 3B Bayamon, Puerto Rico 00961", email: "pmcc4w.puertorico@gmail.com", phone: "(407) 350-9781", subDistrict: "Florida and Great Hispanosphere", city: "Bayamon", state: "PR", coordinates: { lat: 18.3959949, lng: -66.1493391 } },
  { name: "PMCC 4th Watch - San Diego", slug: "pmcc-4th-watch-san-diego", address: "2410 E 8th Street, National City, CA 91950", email: "pmcc4w.sandiego@gmail.com", phone: "(619) 484-7560", subDistrict: "Southwest", city: "National City", state: "CA", coordinates: { lat: 32.6827019, lng: -117.081416 } },
  { name: "PMCC 4th Watch of Arizona", slug: "pmcc-4th-watch-arizona", address: "644 E. Southern Ave. Suite 100, Mesa, AZ 85212", email: "pmcc.arizona@gmail.com", phone: "(310) 220-7967", subDistrict: "Southwest", city: "Mesa", state: "AZ", coordinates: { lat: 33.3935908, lng: -111.8171849 } },
  { name: "PMCC 4th Watch of Colorado", slug: "pmcc-4th-watch-colorado", address: "1413 Potter dr Suite 101 Colorado Springs CO 80909", email: "pmcc4wcoloradosprings@gmail.com", phone: "(650) 201-4109", subDistrict: "Southwest", city: "Colorado Springs", state: "CO", coordinates: { lat: 38.8533925, lng: -104.752097 } },
  { name: "PMCC 4th Watch - Las Vegas", slug: "pmcc-4th-watch-las-vegas", address: "1131 S. Rainbow Blvd Las Vegas, Nevada 89146", email: "Pmcc4wvegas@gmail.com", phone: "(702) 488-0885", subDistrict: "Southwest", city: "Las Vegas", state: "NV", coordinates: { lat: 36.1578902, lng: -115.2445333 } },
  { name: "PMCC 4th Watch - Dallas, Texas", slug: "pmcc-4th-watch-dallas", address: "4206 S Lancaster Rd Ste A Dallas, TX 75216", email: "pmcc4wdallas@gmail.com", phone: "(509) 703-2745", subDistrict: "Southwest", city: "Dallas", state: "TX", coordinates: { lat: 32.6986373, lng: -96.7947253 } },
  { name: "PMCC 4th Watch - Houston, Texas", slug: "pmcc-4th-watch-houston", address: "21540 Provincial Blvd. #1618, Katy, TX 77450", email: "Houston.pmcc4w@gmail.com", phone: "(832) 641-3732", subDistrict: "Southwest", city: "Katy", state: "TX", coordinates: { lat: 29.7776231, lng: -95.7396819 } },
  { name: "PMCC 4th Watch Seattle", slug: "pmcc-4th-watch-seattle", address: "2855 S. Alaska Place Seattle, Wa 98108", email: "4thwatchseattle@gmail.com", phone: "1 (888) 467-3999", subDistrict: "Pacific Northwest", city: "Seattle", state: "WA", coordinates: { lat: 47.5606119, lng: -122.2944606 } },
  { name: "PMCC 4th Watch Spokane", slug: "pmcc-4th-watch-spokane", address: "2004 E 9th Ave. Spokane, WA 99202", email: "pmcc4wspokane@gmail.com", phone: "(509) 535-3796", subDistrict: "Pacific Northwest", city: "Spokane", state: "WA", coordinates: { lat: 47.6469644, lng: -117.3800157 } },
  { name: "PMCC 4th Watch Portland", slug: "pmcc-4th-watch-portland", address: "542 SE 119th Ave. Portland, OR 97216", email: "portland.pmcc4w@gmail.com", phone: "(310) 221-1131", subDistrict: "Pacific Northwest", city: "Portland", state: "OR", coordinates: { lat: 45.5183296, lng: -122.5401888 } },
  { name: "PMCC 4th Watch Anchorage", slug: "pmcc-4th-watch-anchorage", address: "301 E Fireweed Ln, Anchorage, AK 99503", email: "pmcc4thwatch.anchorage@gmail.com", phone: "(907) 727-2994", subDistrict: "Pacific Northwest", city: "Anchorage", state: "AK", coordinates: { lat: 61.1983961, lng: -149.8780849 } },
];

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "superAdmin") {
      return NextResponse.json({ error: "Only superAdmin can seed data" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const results = {
      subDistricts: { created: 0, skipped: 0 },
      churches: { created: 0, skipped: 0, errors: [] as string[] },
    };

    // 1. Create sub-districts
    const sdMap = new Map<string, string>();

    for (const sd of SUB_DISTRICTS) {
      const existing = await payload.find({
        collection: "sub-districts",
        where: { number: { equals: sd.number } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        sdMap.set(sd.name, String(existing.docs[0].id));
        results.subDistricts.skipped++;
      } else {
        const created = await payload.create({
          collection: "sub-districts",
          data: sd,
        });
        sdMap.set(sd.name, String(created.id));
        results.subDistricts.created++;
      }
    }

    // 2. Create churches
    for (const church of CHURCHES) {
      const existing = await payload.find({
        collection: "churches",
        where: { slug: { equals: church.slug } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        results.churches.skipped++;
        continue;
      }

      const sdId = sdMap.get(church.subDistrict);
      if (!sdId) {
        results.churches.errors.push(`Sub-district "${church.subDistrict}" not found for ${church.name}`);
        continue;
      }

      try {
        await payload.create({
          collection: "churches",
          data: {
            name: church.name,
            slug: church.slug,
            address: church.address,
            city: church.city,
            state: church.state,
            email: church.email || undefined,
            phone: church.phone || undefined,
            subDistrict: sdId,
            coordinates: church.coordinates,
          },
        });
        results.churches.created++;
      } catch (err) {
        results.churches.errors.push(`Failed: ${church.name}: ${err}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Seed failed:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
