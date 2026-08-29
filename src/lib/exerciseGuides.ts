export type ExerciseGuide = {
  steps: string[];
  tips?: string[];
};

// Keyed by exact exercise name. Covers the most commonly performed lifts —
// not every row in the library has one yet.
export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  "Bench Press": {
    steps: [
      "Lie on the bench with eyes under the bar, feet flat on the floor.",
      "Grip just outside shoulder width and unrack the bar over your chest.",
      "Lower it with control to your mid-chest, elbows at roughly 45°.",
      "Press back up to full lock-out without bouncing off your chest.",
    ],
    tips: ["Keep your shoulder blades pinched together the whole set.", "Feet stay planted — don't let your hips rise off the bench."],
  },
  "Incline Bench Press": {
    steps: [
      "Set the bench to a 30-45° incline.",
      "Unrack with a grip just outside shoulder width.",
      "Lower to your upper chest, elbows tucked slightly.",
      "Press up and slightly back toward your face until locked out.",
    ],
  },
  "Decline Bench Press": {
    steps: [
      "Secure your feet in the decline bench's foot pads.",
      "Unrack and lower the bar to your lower chest.",
      "Press back up to full extension.",
    ],
  },
  "Dumbbell Bench Press": {
    steps: [
      "Sit on the bench with a dumbbell on each thigh, then lie back, kicking them up to shoulder height.",
      "Lower the dumbbells to the sides of your chest with elbows at ~45°.",
      "Press up until the dumbbells nearly touch above your chest.",
    ],
  },
  "Incline Dumbbell Press": {
    steps: [
      "Set the bench to 30-45° and get the dumbbells up to shoulder height.",
      "Lower with control to the sides of your upper chest.",
      "Press up and slightly inward without clanking the weights together.",
    ],
  },
  "Dumbbell Fly": {
    steps: [
      "Lie on a flat bench holding dumbbells above your chest, palms facing in, slight bend in the elbows.",
      "Lower the weights out to the sides in a wide arc until you feel a stretch across your chest.",
      "Bring them back up along the same arc, squeezing your chest at the top.",
    ],
    tips: ["Keep that elbow bend fixed throughout — this isn't a press."],
  },
  "Cable Fly": {
    steps: [
      "Set both pulleys above shoulder height and stand centered between them.",
      "With a slight elbow bend, bring the handles down and together in front of your chest.",
      "Control the return back out to the stretched position.",
    ],
  },
  "Cable Crossover": {
    steps: [
      "Set pulleys high, step forward into a split stance.",
      "Pull the handles down and across your body to meet at hip height.",
      "Return slowly to the stretch position.",
    ],
  },
  "Push Up": {
    steps: [
      "Start in a plank with hands slightly wider than shoulders.",
      "Lower your chest to just above the floor, elbows at ~45°.",
      "Press back up to a full arm lock-out.",
    ],
    tips: ["Keep a straight line from head to heels the whole rep."],
  },
  "Chest Dip": {
    steps: [
      "Support yourself on the dip bars, leaning your torso forward.",
      "Lower until your shoulders dip below your elbows.",
      "Press back up to lock-out, keeping the forward lean for chest emphasis.",
    ],
  },
  "Machine Chest Press": {
    steps: [
      "Set the seat so handles line up with mid-chest.",
      "Press the handles forward to full extension.",
      "Return with control, letting your chest stretch at the back.",
    ],
  },
  "Pec Deck": {
    steps: [
      "Sit with your back flat against the pad, forearms on the arm pads.",
      "Bring the pads together in front of your chest.",
      "Return slowly, allowing a stretch without letting the weight stack slam.",
    ],
  },
  "Svend Press": {
    steps: [
      "Press a weight plate between both palms at chest height.",
      "Extend your arms straight out, squeezing the plate the entire time.",
      "Pull back to your chest with control.",
    ],
  },
  "Landmine Press": {
    steps: [
      "Load one end of a barbell into a landmine attachment, grip the other end at your shoulder.",
      "Press up and slightly forward until your arm is extended.",
      "Lower back to the shoulder with control.",
    ],
  },

  "Barbell Row": {
    steps: [
      "Hinge at the hips with a flat back, bar hanging at arm's length.",
      "Pull the bar to your lower ribcage, driving your elbows back.",
      "Lower under control without rounding your back.",
    ],
  },
  "Pendlay Row": {
    steps: [
      "Set up bent over with your torso near parallel to the floor, bar on the ground.",
      "Row explosively to your lower chest.",
      "Return the bar fully to the floor each rep before resetting.",
    ],
  },
  "T-Bar Row": {
    steps: [
      "Straddle the bar, hinge forward with a flat back.",
      "Pull the handle to your torso, squeezing your shoulder blades together.",
      "Lower with control to a full stretch.",
    ],
  },
  "Seated Cable Row": {
    steps: [
      "Sit with knees slightly bent, grab the handle with arms extended.",
      "Pull to your torso, driving elbows back and squeezing your back.",
      "Extend back out with control, letting your shoulders round slightly.",
    ],
  },
  "Single-Arm Dumbbell Row": {
    steps: [
      "Support yourself with one knee and hand on a bench, flat back.",
      "Row the dumbbell to your hip, elbow close to your body.",
      "Lower with control to a full stretch.",
    ],
  },
  "Lat Pulldown": {
    steps: [
      "Grip the bar slightly wider than shoulder width, sit with thighs secured.",
      "Pull the bar down to your upper chest, driving elbows down and back.",
      "Let it rise back with control to a full stretch.",
    ],
    tips: ["Avoid leaning back excessively to cheat the weight down."],
  },
  "Straight-Arm Pulldown": {
    steps: [
      "Stand facing a high cable, arms extended and gripping the bar.",
      "Keeping arms straight, pull the bar down to your thighs.",
      "Let it rise back to shoulder height with control.",
    ],
  },
  "Pull Up": {
    steps: [
      "Hang from the bar with an overhand grip, just outside shoulder width.",
      "Pull yourself up until your chin clears the bar.",
      "Lower back to a full dead hang.",
    ],
  },
  "Chin Up": {
    steps: [
      "Hang from the bar with an underhand, shoulder-width grip.",
      "Pull up until your chin clears the bar, squeezing your back and biceps.",
      "Lower back to a full hang.",
    ],
  },
  "Inverted Row": {
    steps: [
      "Set a bar at hip height, lie underneath and grab it, body straight.",
      "Pull your chest to the bar, squeezing your shoulder blades.",
      "Lower back to a full arm extension.",
    ],
  },
  "Meadows Row": {
    steps: [
      "Load one end of a barbell in a landmine, stand alongside it.",
      "Hinge forward and row the bar up to your hip with one arm.",
      "Lower with control to a full stretch.",
    ],
  },
  "Chest Supported Row": {
    steps: [
      "Lie chest-down on an incline bench, dumbbells or bar hanging below.",
      "Row up, squeezing your shoulder blades together.",
      "Lower with control to a full stretch.",
    ],
  },
  "Landmine Row": {
    steps: [
      "Straddle the landmine barbell, hinge forward with a flat back.",
      "Row the end of the bar up to your torso.",
      "Lower with control.",
    ],
  },
  "Deadlift": {
    steps: [
      "Stand with feet hip-width, bar over mid-foot.",
      "Hinge down and grip just outside your legs, flat back, chest up.",
      "Drive through the floor, extending hips and knees together to standing.",
      "Lower the bar back down by reversing the same path.",
    ],
    tips: ["Keep the bar as close to your shins/thighs as possible the whole rep."],
  },
  "Sumo Deadlift": {
    steps: [
      "Take a wide stance, toes pointed out, grip inside your knees.",
      "Drop your hips down, chest up, flat back.",
      "Drive through the floor, extending hips and knees to standing.",
    ],
  },
  "Trap Bar Deadlift": {
    steps: [
      "Stand centered inside the trap bar, feet hip-width.",
      "Hinge down and grip the handles, flat back, chest up.",
      "Drive through the floor to standing, keeping the bar path vertical.",
    ],
  },
  "Rack Pull": {
    steps: [
      "Set the bar on safety pins around knee height.",
      "Grip the bar, flat back, chest up.",
      "Drive through the floor to lock out your hips.",
    ],
  },
  "Good Morning": {
    steps: [
      "Rest a bar on your upper back like a squat.",
      "Hinge at the hips, pushing them back, flat back the whole time.",
      "Return to standing by driving your hips forward.",
    ],
  },
  "Back Extension": {
    steps: [
      "Position your hips on the pad, ankles secured, body straight.",
      "Lower your torso down until you feel a stretch in your hamstrings/lower back.",
      "Raise back up to a straight line — don't hyperextend at the top.",
    ],
  },
  "Barbell Shrug": {
    steps: [
      "Hold a bar at arm's length in front of your thighs.",
      "Shrug your shoulders straight up toward your ears.",
      "Lower with control — don't roll your shoulders.",
    ],
  },
  "Dumbbell Shrug": {
    steps: [
      "Hold a dumbbell in each hand at your sides.",
      "Shrug your shoulders straight up.",
      "Lower with control.",
    ],
  },
  "Farmer's Carry": {
    steps: [
      "Pick up a heavy dumbbell or kettlebell in each hand.",
      "Stand tall, shoulders back, and walk for distance or time.",
      "Keep your core braced and grip tight the whole way.",
    ],
  },
  "Dead Hang": {
    steps: [
      "Grip a pull-up bar with hands just outside shoulder width.",
      "Let your body hang fully, shoulders relaxed but engaged.",
      "Hold for time, keeping your core braced.",
    ],
  },

  "Barbell Squat": {
    steps: [
      "Set the bar across your upper back, feet shoulder-width apart.",
      "Brace your core, break at the hips and knees together.",
      "Squat down until your hip crease passes below your knee.",
      "Drive back up through your whole foot to standing.",
    ],
    tips: ["Keep your chest up and knees tracking over your toes throughout."],
  },
  "Front Squat": {
    steps: [
      "Rest the bar on your front shoulders, elbows up high.",
      "Brace your core and squat down, staying upright.",
      "Drive back up to standing, elbows staying high the whole time.",
    ],
  },
  "Goblet Squat": {
    steps: [
      "Hold a dumbbell vertically against your chest.",
      "Squat down between your knees, staying upright.",
      "Drive back up to standing.",
    ],
  },
  "Hack Squat": {
    steps: [
      "Set your shoulders and back against the machine pads, feet mid-platform.",
      "Lower under control until your thighs are past parallel.",
      "Drive through your feet back to standing.",
    ],
  },
  "Bulgarian Split Squat": {
    steps: [
      "Rest one foot behind you on a bench, most weight on the front leg.",
      "Lower straight down until your back knee nearly touches the floor.",
      "Drive through your front foot back to standing.",
    ],
  },
  "Walking Lunge": {
    steps: [
      "Step forward into a long stride, lowering your back knee toward the floor.",
      "Push off your front foot and step through into the next lunge.",
      "Keep your torso upright throughout.",
    ],
  },
  "Reverse Lunge": {
    steps: [
      "Step backward into a lunge, lowering your back knee toward the floor.",
      "Push through your front foot back to standing.",
    ],
  },
  "Leg Press": {
    steps: [
      "Sit with feet shoulder-width on the platform.",
      "Lower the platform until your knees reach about 90°.",
      "Press back up without locking your knees out hard.",
    ],
  },
  "Romanian Deadlift": {
    steps: [
      "Hold the bar at hip level, soft knees.",
      "Push your hips back, lowering the bar along your legs, flat back.",
      "Feel a hamstring stretch, then drive your hips forward back to standing.",
    ],
  },
  "Leg Extension": {
    steps: [
      "Sit with the pad resting on your lower shins, knees at the machine's pivot.",
      "Extend your legs to full lock-out.",
      "Lower with control back to the start.",
    ],
  },
  "Leg Curl": {
    steps: [
      "Position yourself so the pad sits on the back of your ankles.",
      "Curl your heels toward your glutes.",
      "Lower with control back to full extension.",
    ],
  },
  "Nordic Hamstring Curl": {
    steps: [
      "Kneel with your ankles anchored, torso upright.",
      "Lower your torso forward as slowly as possible, resisting with your hamstrings.",
      "Catch yourself and push back up, or use your hands to assist.",
    ],
  },
  "Standing Calf Raise": {
    steps: [
      "Stand on the platform with the balls of your feet, heels hanging off.",
      "Rise up onto your toes as high as possible.",
      "Lower slowly below the platform for a full stretch.",
    ],
  },
  "Seated Calf Raise": {
    steps: [
      "Sit with the pad resting on your lower thighs, balls of feet on the platform.",
      "Rise up onto your toes.",
      "Lower slowly for a full stretch.",
    ],
  },
  "Hip Thrust": {
    steps: [
      "Rest your upper back on a bench, bar over your hips.",
      "Drive your hips up until your torso is parallel to the floor.",
      "Squeeze your glutes at the top, then lower with control.",
    ],
  },
  "Glute Bridge": {
    steps: [
      "Lie on your back, knees bent, feet flat.",
      "Drive your hips up, squeezing your glutes at the top.",
      "Lower with control.",
    ],
  },
  "Hip Abduction": {
    steps: [
      "Sit in the machine with the pads against the outside of your knees.",
      "Push your legs outward against the resistance.",
      "Return with control.",
    ],
  },
  "Hip Adduction": {
    steps: [
      "Sit in the machine with the pads against the inside of your knees.",
      "Squeeze your legs together against the resistance.",
      "Return with control.",
    ],
  },
  "Pistol Squat": {
    steps: [
      "Stand on one leg, extending the other straight out in front.",
      "Lower yourself down as far as you can under control, arms out for balance.",
      "Drive back up through the standing leg.",
    ],
  },
  "Cossack Squat": {
    steps: [
      "Take a wide stance, toes slightly out.",
      "Shift your weight to one side, bending that knee and sitting back into it, other leg stays straight.",
      "Push back through the bent leg to the center, then repeat to the other side.",
    ],
  },
  "Shrimp Squat": {
    steps: [
      "Stand on one leg, holding the other foot behind you with the same-side hand.",
      "Lower down under control, letting your back knee nearly touch the floor.",
      "Drive back up through the standing leg.",
    ],
  },
  "Sissy Squat": {
    steps: [
      "Rise onto your toes, hold something for balance.",
      "Lean back and bend your knees, keeping hips extended, lowering as far as controlled.",
      "Drive back up through your quads.",
    ],
  },
  "Step Up": {
    steps: [
      "Place one foot fully on a box or bench.",
      "Drive through that foot to stand up on the box.",
      "Step back down with control and repeat.",
    ],
  },
  "Box Jump": {
    steps: [
      "Stand facing the box, feet shoulder-width.",
      "Swing your arms and jump up, landing softly with both feet on the box.",
      "Stand fully upright, then step back down — don't jump down.",
    ],
  },
  "Sled Push": {
    steps: [
      "Load the sled, grip the handles at a comfortable height.",
      "Drive forward in short, powerful steps, leaning into the sled.",
      "Keep your back flat and core braced throughout.",
    ],
  },
  "Sled Pull": {
    steps: [
      "Attach a strap or rope to the sled, face away from it.",
      "Walk or drive backward, pulling the sled toward you.",
      "Keep your steps controlled and core braced.",
    ],
  },
  "Kettlebell Swing": {
    steps: [
      "Stand with feet shoulder-width, kettlebell a foot in front of you.",
      "Hinge and grip it, then hike it back between your legs.",
      "Snap your hips forward explosively to swing it to chest height.",
      "Let it swing back down and repeat the hip hinge.",
    ],
    tips: ["This is a hip hinge, not a squat — power comes from the glutes and hamstrings."],
  },

  "Overhead Press": {
    steps: [
      "Hold the bar at shoulder height, hands just outside shoulders.",
      "Brace your core and press straight up until arms lock out overhead.",
      "Lower back to the shoulders with control.",
    ],
  },
  "Push Press": {
    steps: [
      "Hold the bar at shoulder height, knees slightly bent.",
      "Dip your knees briefly, then drive up and press the bar overhead using that leg drive.",
      "Lower back to the shoulders with control.",
    ],
  },
  "Seated Dumbbell Press": {
    steps: [
      "Sit with back support, dumbbells at shoulder height.",
      "Press straight up until arms lock out overhead.",
      "Lower back to shoulder height with control.",
    ],
  },
  "Arnold Press": {
    steps: [
      "Hold dumbbells in front of your shoulders, palms facing you.",
      "Press up while rotating your palms to face forward at the top.",
      "Reverse the rotation as you lower back down.",
    ],
  },
  "Lateral Raise": {
    steps: [
      "Hold dumbbells at your sides, slight bend in the elbows.",
      "Raise your arms out to the sides until roughly shoulder height.",
      "Lower with control — don't swing the weight.",
    ],
  },
  "Cable Lateral Raise": {
    steps: [
      "Stand side-on to a low cable pulley, handle in the far hand.",
      "Raise your arm out to the side until shoulder height.",
      "Lower with control.",
    ],
  },
  "Egyptian Lateral Raise": {
    steps: [
      "Stand side-on to a low cable, leaning away from it slightly, holding a rail for support.",
      "Raise the handle out and up, leaning into the stretch.",
      "Lower with control back to the start.",
    ],
  },
  "Front Raise": {
    steps: [
      "Hold dumbbells in front of your thighs.",
      "Raise one or both arms straight out in front to shoulder height.",
      "Lower with control.",
    ],
  },
  "Rear Delt Fly": {
    steps: [
      "Hinge forward at the hips, dumbbells hanging below your chest.",
      "Raise your arms out to the sides, squeezing your shoulder blades.",
      "Lower with control.",
    ],
  },
  "Face Pull": {
    steps: [
      "Set a cable at head height with a rope attachment.",
      "Pull the rope toward your face, elbows high, squeezing your shoulder blades.",
      "Return with control.",
    ],
  },
  "Upright Row": {
    steps: [
      "Hold a bar in front of your thighs, hands shoulder-width.",
      "Pull it straight up toward your chin, elbows leading.",
      "Lower with control.",
    ],
  },

  "Bicep Curl": {
    steps: [
      "Hold dumbbells at your sides, palms facing forward.",
      "Curl the weight up toward your shoulders, keeping elbows pinned to your sides.",
      "Lower with control to a full stretch.",
    ],
  },
  "Barbell Curl": {
    steps: [
      "Hold the bar with an underhand grip, shoulder-width.",
      "Curl it up toward your chest, elbows fixed at your sides.",
      "Lower with control.",
    ],
  },
  "EZ-Bar Curl": {
    steps: [
      "Grip the EZ-bar on the angled part, hands roughly shoulder-width.",
      "Curl it up toward your chest, elbows fixed at your sides.",
      "Lower with control.",
    ],
  },
  "Hammer Curl": {
    steps: [
      "Hold dumbbells at your sides, palms facing each other.",
      "Curl up keeping that neutral grip, elbows pinned to your sides.",
      "Lower with control.",
    ],
  },
  "Preacher Curl": {
    steps: [
      "Rest your arms on the preacher pad, dumbbell or bar in hand.",
      "Curl up toward your shoulders.",
      "Lower with control to a full stretch, without letting your elbows hyperextend.",
    ],
  },
  "Spider Curl": {
    steps: [
      "Lie chest-down on an incline bench, arms hanging straight down.",
      "Curl the weight up toward your shoulders.",
      "Lower with control to a full stretch.",
    ],
  },
  "Concentration Curl": {
    steps: [
      "Sit, brace your elbow against the inside of your thigh.",
      "Curl the dumbbell up toward your shoulder.",
      "Lower with control.",
    ],
  },
  "Cable Curl": {
    steps: [
      "Stand facing a low cable pulley, grip the bar with an underhand grip.",
      "Curl up toward your chest, elbows fixed.",
      "Lower with control.",
    ],
  },
  "Kitty Curls": {
    steps: [
      "Set the cable low with a bar or rope handle.",
      "Curl up toward your chest, wrists staying neutral.",
      "Lower with control.",
    ],
    tips: ["House variation of a cable curl — same cues, just your own name for it."],
  },
  "Tricep Pushdown": {
    steps: [
      "Stand facing a high cable with a bar or rope attachment, elbows pinned to your sides.",
      "Push down until your arms are fully extended.",
      "Return with control, keeping your elbows locked in place.",
    ],
  },
  "Leon Pushdown": {
    steps: [
      "Set a cable high with your chosen handle, elbows pinned to your sides.",
      "Push down until your arms fully extend, squeezing your triceps.",
      "Return with control, keeping elbows fixed.",
    ],
    tips: ["House variation of a tricep pushdown — same cues, your own name for it."],
  },
  "Skull Crusher": {
    steps: [
      "Lie on a bench holding a bar or dumbbells above your chest.",
      "Bend your elbows, lowering the weight toward your forehead.",
      "Extend back up, keeping your upper arms still.",
    ],
  },
  "Overhead Tricep Extension": {
    steps: [
      "Hold a dumbbell with both hands overhead, arms extended.",
      "Lower it behind your head by bending your elbows.",
      "Extend back up to full lock-out.",
    ],
  },
  "Close-Grip Bench Press": {
    steps: [
      "Grip the bar just inside shoulder width, lying on a flat bench.",
      "Lower to your chest, elbows tracking close to your body.",
      "Press back up to full extension.",
    ],
  },
  "JM Press": {
    steps: [
      "Lie on a bench holding a bar with a close grip.",
      "Lower it toward your upper chest/chin, elbows tracking forward and down.",
      "Press back up to lock-out.",
    ],
  },
  "Tricep Dip": {
    steps: [
      "Support yourself on parallel bars, torso upright.",
      "Lower until your elbows reach about 90°.",
      "Press back up to lock-out.",
    ],
  },
  "Diamond Push Up": {
    steps: [
      "Get into a push-up position with your hands together, thumbs and index fingers touching.",
      "Lower your chest toward your hands.",
      "Press back up to full extension.",
    ],
  },

  "Plank": {
    steps: [
      "Prop yourself on your forearms and toes, body in a straight line.",
      "Brace your core and squeeze your glutes.",
      "Hold for time without letting your hips sag or pike up.",
    ],
  },
  "Side Plank": {
    steps: [
      "Prop yourself on one forearm, body in a straight line, feet stacked.",
      "Lift your hips so your body forms a straight diagonal line.",
      "Hold for time, then repeat on the other side.",
    ],
  },
  "Hanging Leg Raise": {
    steps: [
      "Hang from a pull-up bar, legs extended.",
      "Raise your legs up until roughly parallel to the floor (or higher).",
      "Lower with control, avoiding a swing.",
    ],
  },
  "Toes to Bar": {
    steps: [
      "Hang from the bar, initiate a slight swing.",
      "Bring your toes up to touch the bar, using your core to curl your hips up.",
      "Lower with control back to a hang.",
    ],
  },
  "Sit Up": {
    steps: [
      "Lie on your back, knees bent, feet anchored or flat.",
      "Curl your torso all the way up to your knees.",
      "Lower back down with control.",
    ],
  },
  "V-Up": {
    steps: [
      "Lie flat, arms extended overhead.",
      "Simultaneously raise your legs and torso, reaching your hands toward your toes.",
      "Lower back down with control.",
    ],
  },
  "Cable Crunch": {
    steps: [
      "Kneel below a high cable with a rope attachment held at your head.",
      "Crunch down, bringing your elbows toward your knees.",
      "Return with control, keeping tension on your abs.",
    ],
  },
  "Russian Twist": {
    steps: [
      "Sit with knees bent, torso leaned back slightly, feet off the floor (optional).",
      "Rotate your torso to touch the floor on each side, holding a weight if desired.",
    ],
  },
  "Ab Wheel Rollout": {
    steps: [
      "Kneel holding the ab wheel, hands on the grips.",
      "Roll forward, extending your body as far as you can control.",
      "Pull back to the start using your core, not your lower back.",
    ],
  },
  "Pallof Press": {
    steps: [
      "Stand side-on to a cable set at chest height, handle held at your chest.",
      "Press the handle straight out in front of you, resisting the pull to rotate.",
      "Return with control, keeping your core braced the whole time.",
    ],
  },
  "Dead Bug": {
    steps: [
      "Lie on your back, arms up, knees bent at 90°.",
      "Lower one arm and the opposite leg toward the floor without arching your back.",
      "Return to the start and alternate sides.",
    ],
  },
  "Bear Crawl": {
    steps: [
      "Start on hands and knees, then lift your knees slightly off the floor.",
      "Crawl forward moving opposite hand and foot together, keeping your back flat.",
    ],
  },
  "Copenhagen Plank": {
    steps: [
      "Lie on your side, top foot propped on a bench, bottom leg free.",
      "Prop up on your forearm, lifting your hips into a side-plank line.",
      "Hold for time, then repeat on the other side.",
    ],
    tips: ["Targets the adductors hard — start with a bent-knee version if it's your first time."],
  },
  "Turkish Get-Up": {
    steps: [
      "Lie on your back holding a kettlebell pressed above one shoulder.",
      "Work through the sequence — roll to an elbow, then a hand, bridge the hips, sweep the leg through, and stand up — keeping the weight locked overhead the whole time.",
      "Reverse the steps to return to the floor.",
    ],
    tips: ["Learn this one slow and light — it's a full-body skill move before it's a strength move."],
  },
  "Mountain Climber": {
    steps: [
      "Start in a push-up position.",
      "Drive one knee toward your chest, then quickly switch legs.",
      "Keep your hips low and core braced throughout.",
    ],
  },

  "Running": {
    steps: [
      "Warm up with an easy walk or jog for a few minutes.",
      "Settle into a pace where you can hold a conversation for base building, or push harder for intervals.",
      "Cool down with an easy walk to bring your heart rate down.",
    ],
  },
  "Cycling": {
    steps: [
      "Adjust the seat so your knee has a slight bend at the bottom of the pedal stroke.",
      "Warm up at an easy resistance before building intensity.",
    ],
  },
  "Rowing Machine": {
    steps: [
      "Start with legs bent, arms extended, gripping the handle.",
      "Drive with your legs first, then lean back, then pull the handle to your chest.",
      "Reverse the order on the way back: arms out, lean forward, then bend your knees.",
    ],
  },
  "Jump Rope": {
    steps: [
      "Hold the handles loosely, rotating the rope from your wrists, not your shoulders.",
      "Jump just high enough to clear the rope, landing softly on the balls of your feet.",
    ],
  },
  "Assault Bike": {
    steps: [
      "Set a pace using both arms and legs together.",
      "Push hard for intervals or hold a steady effort for longer sessions.",
    ],
  },
  "Stair Climber": {
    steps: [
      "Stand upright, hands lightly on the rails for balance only.",
      "Step at a steady, sustainable pace, avoiding leaning on the rails to take weight off your legs.",
    ],
  },
  "Burpee": {
    steps: [
      "From standing, drop into a squat and place your hands on the floor.",
      "Kick your feet back into a plank, then do a push-up (optional).",
      "Jump your feet back to your hands, then jump up explosively.",
    ],
  },
  "Elliptical": {
    steps: [
      "Stand centered on the pedals, holding the moving or stationary handles.",
      "Pedal in a smooth, continuous motion at a sustainable pace.",
    ],
  },
  "Interval Walking": {
    steps: [
      "Alternate 3 minutes of brisk, fast-paced walking with 3 minutes of a relaxed, easy pace.",
      "Repeat for 20-30 minutes total.",
    ],
    tips: ["Also known as \"Japanese walking\" — the interval structure is what makes it more effective than a steady stroll."],
  },
};
