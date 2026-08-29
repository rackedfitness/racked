// Minimal line-art start/end pose pairs for the most common lifts.
// Abstract by design (head + torso + limb lines) rather than anatomically
// literal — the goal is a quick visual cue next to the written steps, not a
// photo reference.

function Figure({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function Weight({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r="4.5" fill="currentColor" stroke="none" />;
}

const POSES: Record<string, { start: React.ReactNode; end: React.ReactNode }> = {
  "Bench Press": {
    start: (
      <Figure>
        <line x1="18" y1="80" x2="72" y2="80" />
        <circle cx="26" cy="70" r="7" />
        <line x1="33" y1="71" x2="60" y2="73" />
        <line x1="60" y1="73" x2="66" y2="86" />
        <line x1="66" y1="86" x2="80" y2="82" />
        <line x1="42" y1="72" x2="42" y2="46" />
        <line x1="25" y1="46" x2="59" y2="46" />
        <Weight cx={25} cy={46} />
        <Weight cx={59} cy={46} />
      </Figure>
    ),
    end: (
      <Figure>
        <line x1="18" y1="80" x2="72" y2="80" />
        <circle cx="26" cy="70" r="7" />
        <line x1="33" y1="71" x2="60" y2="73" />
        <line x1="60" y1="73" x2="66" y2="86" />
        <line x1="66" y1="86" x2="80" y2="82" />
        <line x1="42" y1="72" x2="42" y2="65" />
        <line x1="29" y1="65" x2="55" y2="65" />
        <Weight cx={29} cy={65} />
        <Weight cx={55} cy={65} />
      </Figure>
    ),
  },
  "Barbell Squat": {
    start: (
      <Figure>
        <circle cx="50" cy="18" r="7" />
        <line x1="50" y1="25" x2="50" y2="55" />
        <line x1="50" y1="55" x2="43" y2="82" />
        <line x1="50" y1="55" x2="57" y2="82" />
        <line x1="26" y1="24" x2="74" y2="24" />
        <Weight cx={26} cy={24} />
        <Weight cx={74} cy={24} />
        <line x1="50" y1="27" x2="34" y2="24" />
        <line x1="50" y1="27" x2="66" y2="24" />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="50" cy="38" r="7" />
        <line x1="50" y1="45" x2="50" y2="62" />
        <line x1="50" y1="62" x2="38" y2="66" />
        <line x1="38" y1="66" x2="42" y2="86" />
        <line x1="50" y1="62" x2="62" y2="66" />
        <line x1="62" y1="66" x2="58" y2="86" />
        <line x1="26" y1="44" x2="74" y2="44" />
        <Weight cx={26} cy={44} />
        <Weight cx={74} cy={44} />
        <line x1="50" y1="47" x2="34" y2="44" />
        <line x1="50" y1="47" x2="66" y2="44" />
      </Figure>
    ),
  },
  "Deadlift": {
    start: (
      <Figure>
        <circle cx="34" cy="28" r="7" />
        <line x1="38" y1="34" x2="58" y2="56" />
        <line x1="58" y1="56" x2="56" y2="82" />
        <line x1="58" y1="56" x2="66" y2="82" />
        <line x1="46" y1="40" x2="40" y2="80" />
        <line x1="22" y1="82" x2="52" y2="82" />
        <Weight cx={22} cy={82} />
        <Weight cx={52} cy={82} />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="50" cy="16" r="7" />
        <line x1="50" y1="23" x2="50" y2="52" />
        <line x1="50" y1="52" x2="50" y2="82" />
        <line x1="50" y1="27" x2="43" y2="55" />
        <line x1="28" y1="55" x2="58" y2="55" />
        <Weight cx={28} cy={55} />
        <Weight cx={58} cy={55} />
      </Figure>
    ),
  },
  "Overhead Press": {
    start: (
      <Figure>
        <circle cx="50" cy="20" r="7" />
        <line x1="50" y1="27" x2="50" y2="58" />
        <line x1="50" y1="58" x2="44" y2="84" />
        <line x1="50" y1="58" x2="56" y2="84" />
        <line x1="34" y1="34" x2="42" y2="40" />
        <line x1="66" y1="34" x2="58" y2="40" />
        <line x1="30" y1="34" x2="70" y2="34" />
        <Weight cx={30} cy={34} />
        <Weight cx={70} cy={34} />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="50" cy="26" r="7" />
        <line x1="50" y1="33" x2="50" y2="60" />
        <line x1="50" y1="60" x2="44" y2="84" />
        <line x1="50" y1="60" x2="56" y2="84" />
        <line x1="34" y1="10" x2="42" y2="34" />
        <line x1="66" y1="10" x2="58" y2="34" />
        <line x1="30" y1="10" x2="70" y2="10" />
        <Weight cx={30} cy={10} />
        <Weight cx={70} cy={10} />
      </Figure>
    ),
  },
  "Pull Up": {
    start: (
      <Figure>
        <line x1="20" y1="10" x2="80" y2="10" />
        <line x1="38" y1="10" x2="30" y2="10" />
        <line x1="62" y1="10" x2="70" y2="10" />
        <circle cx="50" cy="28" r="7" />
        <line x1="38" y1="12" x2="46" y2="34" />
        <line x1="62" y1="12" x2="54" y2="34" />
        <line x1="50" y1="35" x2="50" y2="65" />
        <line x1="50" y1="65" x2="43" y2="90" />
        <line x1="50" y1="65" x2="57" y2="90" />
      </Figure>
    ),
    end: (
      <Figure>
        <line x1="20" y1="10" x2="80" y2="10" />
        <circle cx="50" cy="18" r="7" />
        <line x1="38" y1="10" x2="46" y2="22" />
        <line x1="62" y1="10" x2="54" y2="22" />
        <line x1="50" y1="25" x2="50" y2="55" />
        <line x1="50" y1="55" x2="43" y2="88" />
        <line x1="50" y1="55" x2="57" y2="88" />
      </Figure>
    ),
  },
  "Push Up": {
    start: (
      <Figure>
        <circle cx="18" cy="58" r="7" />
        <line x1="25" y1="59" x2="75" y2="63" />
        <line x1="75" y1="63" x2="86" y2="60" />
        <line x1="38" y1="60" x2="38" y2="82" />
        <line x1="60" y1="61" x2="60" y2="83" />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="18" cy="72" r="7" />
        <line x1="25" y1="73" x2="75" y2="76" />
        <line x1="75" y1="76" x2="86" y2="73" />
        <line x1="38" y1="74" x2="34" y2="82" />
        <line x1="60" y1="75" x2="56" y2="83" />
      </Figure>
    ),
  },
  "Bicep Curl": {
    start: (
      <Figure>
        <circle cx="50" cy="18" r="7" />
        <line x1="50" y1="25" x2="50" y2="58" />
        <line x1="50" y1="58" x2="44" y2="86" />
        <line x1="50" y1="58" x2="56" y2="86" />
        <line x1="41" y1="30" x2="36" y2="60" />
        <Weight cx={36} cy={62} />
        <line x1="59" y1="30" x2="64" y2="60" />
        <Weight cx={64} cy={62} />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="50" cy="18" r="7" />
        <line x1="50" y1="25" x2="50" y2="58" />
        <line x1="50" y1="58" x2="44" y2="86" />
        <line x1="50" y1="58" x2="56" y2="86" />
        <line x1="41" y1="30" x2="34" y2="44" />
        <line x1="34" y1="44" x2="40" y2="28" />
        <Weight cx={40} cy={26} />
        <line x1="59" y1="30" x2="66" y2="44" />
        <line x1="66" y1="44" x2="60" y2="28" />
        <Weight cx={60} cy={26} />
      </Figure>
    ),
  },
  "Barbell Row": {
    start: (
      <Figure>
        <circle cx="30" cy="30" r="7" />
        <line x1="34" y1="36" x2="58" y2="56" />
        <line x1="58" y1="56" x2="60" y2="82" />
        <line x1="58" y1="56" x2="70" y2="80" />
        <line x1="44" y1="42" x2="38" y2="78" />
        <line x1="24" y1="80" x2="52" y2="80" />
        <Weight cx={24} cy={80} />
        <Weight cx={52} cy={80} />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="30" cy="30" r="7" />
        <line x1="34" y1="36" x2="58" y2="56" />
        <line x1="58" y1="56" x2="60" y2="82" />
        <line x1="58" y1="56" x2="70" y2="80" />
        <line x1="44" y1="42" x2="52" y2="58" />
        <line x1="38" y1="58" x2="66" y2="58" />
        <Weight cx={38} cy={58} />
        <Weight cx={66} cy={58} />
      </Figure>
    ),
  },
  "Plank": {
    start: (
      <Figure>
        <circle cx="18" cy="60" r="7" />
        <line x1="25" y1="61" x2="76" y2="65" />
        <line x1="76" y1="65" x2="86" y2="62" />
        <line x1="38" y1="62" x2="36" y2="84" />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="18" cy="60" r="7" />
        <line x1="25" y1="61" x2="76" y2="65" />
        <line x1="76" y1="65" x2="86" y2="62" />
        <line x1="38" y1="62" x2="36" y2="84" />
      </Figure>
    ),
  },
  "Lateral Raise": {
    start: (
      <Figure>
        <circle cx="50" cy="18" r="7" />
        <line x1="50" y1="25" x2="50" y2="58" />
        <line x1="50" y1="58" x2="44" y2="86" />
        <line x1="50" y1="58" x2="56" y2="86" />
        <line x1="47" y1="30" x2="45" y2="60" />
        <Weight cx={45} cy={62} />
        <line x1="53" y1="30" x2="55" y2="60" />
        <Weight cx={55} cy={62} />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="50" cy="18" r="7" />
        <line x1="50" y1="25" x2="50" y2="58" />
        <line x1="50" y1="58" x2="44" y2="86" />
        <line x1="50" y1="58" x2="56" y2="86" />
        <line x1="43" y1="30" x2="18" y2="34" />
        <Weight cx={18} cy={34} />
        <line x1="57" y1="30" x2="82" y2="34" />
        <Weight cx={82} cy={34} />
      </Figure>
    ),
  },
  "Walking Lunge": {
    start: (
      <Figure>
        <circle cx="50" cy="16" r="7" />
        <line x1="50" y1="23" x2="50" y2="52" />
        <line x1="50" y1="52" x2="47" y2="80" />
        <line x1="50" y1="52" x2="53" y2="80" />
        <line x1="38" y1="30" x2="36" y2="55" />
        <line x1="62" y1="30" x2="64" y2="55" />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="42" cy="22" r="7" />
        <line x1="42" y1="29" x2="46" y2="54" />
        <line x1="46" y1="54" x2="30" y2="60" />
        <line x1="30" y1="60" x2="30" y2="82" />
        <line x1="46" y1="54" x2="66" y2="58" />
        <line x1="66" y1="58" x2="72" y2="80" />
        <line x1="30" y1="34" x2="28" y2="56" />
        <line x1="54" y1="34" x2="58" y2="56" />
      </Figure>
    ),
  },
  "Lat Pulldown": {
    start: (
      <Figure>
        <line x1="30" y1="8" x2="70" y2="8" />
        <circle cx="50" cy="26" r="7" />
        <line x1="38" y1="10" x2="46" y2="32" />
        <line x1="62" y1="10" x2="54" y2="32" />
        <line x1="50" y1="33" x2="50" y2="62" />
        <line x1="42" y1="63" x2="58" y2="63" />
        <line x1="38" y1="80" x2="46" y2="64" />
        <line x1="62" y1="80" x2="54" y2="64" />
      </Figure>
    ),
    end: (
      <Figure>
        <line x1="30" y1="8" x2="70" y2="8" />
        <circle cx="50" cy="26" r="7" />
        <line x1="38" y1="20" x2="46" y2="34" />
        <line x1="62" y1="20" x2="54" y2="34" />
        <line x1="34" y1="20" x2="66" y2="20" />
        <line x1="50" y1="34" x2="50" y2="62" />
        <line x1="42" y1="63" x2="58" y2="63" />
        <line x1="38" y1="80" x2="46" y2="64" />
        <line x1="62" y1="80" x2="54" y2="64" />
      </Figure>
    ),
  },
  "Tricep Pushdown": {
    start: (
      <Figure>
        <circle cx="50" cy="16" r="7" />
        <line x1="50" y1="23" x2="50" y2="55" />
        <line x1="50" y1="55" x2="44" y2="84" />
        <line x1="50" y1="55" x2="56" y2="84" />
        <line x1="44" y1="26" x2="40" y2="44" />
        <line x1="40" y1="44" x2="45" y2="30" />
        <line x1="56" y1="26" x2="60" y2="44" />
        <line x1="60" y1="44" x2="55" y2="30" />
        <line x1="35" y1="30" x2="65" y2="30" />
      </Figure>
    ),
    end: (
      <Figure>
        <circle cx="50" cy="16" r="7" />
        <line x1="50" y1="23" x2="50" y2="55" />
        <line x1="50" y1="55" x2="44" y2="84" />
        <line x1="50" y1="55" x2="56" y2="84" />
        <line x1="44" y1="26" x2="40" y2="62" />
        <line x1="56" y1="26" x2="60" y2="62" />
        <line x1="35" y1="30" x2="65" y2="30" />
      </Figure>
    ),
  },
  "Dumbbell Bench Press": {
    start: (
      <Figure>
        <line x1="18" y1="80" x2="72" y2="80" />
        <circle cx="26" cy="70" r="7" />
        <line x1="33" y1="71" x2="60" y2="73" />
        <line x1="60" y1="73" x2="66" y2="86" />
        <line x1="66" y1="86" x2="80" y2="82" />
        <line x1="40" y1="72" x2="30" y2="50" />
        <Weight cx={30} cy={48} />
        <line x1="46" y1="72" x2="56" y2="50" />
        <Weight cx={56} cy={48} />
      </Figure>
    ),
    end: (
      <Figure>
        <line x1="18" y1="80" x2="72" y2="80" />
        <circle cx="26" cy="70" r="7" />
        <line x1="33" y1="71" x2="60" y2="73" />
        <line x1="60" y1="73" x2="66" y2="86" />
        <line x1="66" y1="86" x2="80" y2="82" />
        <line x1="40" y1="72" x2="38" y2="60" />
        <Weight cx={38} cy={58} />
        <line x1="46" y1="72" x2="48" y2="60" />
        <Weight cx={48} cy={58} />
      </Figure>
    ),
  },
};

export function getPose(name: string) {
  return POSES[name];
}
