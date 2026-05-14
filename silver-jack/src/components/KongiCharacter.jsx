import { STAGES } from '../utils/gameLogic.js';
import './KongiCharacter.css';

export default function KongiCharacter({ stage, mood }) {
  return (
    <div className={`kongi-wrap mood-${mood}`}>
      {stage === STAGES.DEAD      && <DeadKongi />}
      {stage === STAGES.SOAKING   && <SoakingKongi />}
      {stage === STAGES.GERMINATE && <GerminateKongi />}
      {stage === STAGES.TINY      && <TinyKongi />}
      {stage === STAGES.GROWING   && <GrowingKongi />}
      {stage === STAGES.SPROUT    && <SproutKongi />}
      {stage === STAGES.FULL      && <FullKongi />}
      {stage === STAGES.HARVEST   && <HarvestKongi />}
    </div>
  );
}

/* ── 공통 얼굴 헬퍼 ── */
function Face({ eyeGap = 18, eyeTop = 14, mouthType = 'smile', blush = false }) {
  return (
    <div className="face">
      <div className="eye left"  style={{ left: eyeGap, top: eyeTop }} />
      <div className="eye right" style={{ right: eyeGap, top: eyeTop }} />
      <div className={`mouth ${mouthType}`} />
      {blush && <><div className="blush left" /><div className="blush right" /></>}
    </div>
  );
}

/* ── 1일: 씨앗 담그기 (물에 담긴 콩) ── */
function SoakingKongi() {
  return (
    <div className="kongi soaking-kongi">
      <div className="bowl">
        <div className="water-surface" />
        <div className="seed-in-water">
          <Face eyeGap={10} eyeTop={12} mouthType="tiny-smile" />
        </div>
      </div>
      <div className="soil" />
    </div>
  );
}

/* ── 2일: 발아 (뿌리 내리기 시작) ── */
function GerminateKongi() {
  return (
    <div className="kongi germinate-kongi">
      <div className="seed-body">
        <Face eyeGap={10} eyeTop={12} mouthType="tiny-smile" />
      </div>
      <div className="root-tail" />
      <div className="soil" />
    </div>
  );
}

/* ── 3일: 새싹 출현 ── */
function TinyKongi() {
  return (
    <div className="kongi tiny-kongi">
      <div className="tiny-head">
        <Face eyeGap={8} eyeTop={10} mouthType="smile" blush />
      </div>
      <div className="white-stem s30" />
      <div className="soil" />
    </div>
  );
}

/* ── 4일: 성장 ── */
function GrowingKongi() {
  return (
    <div className="kongi growing-kongi">
      <div className="growing-head">
        <Face eyeGap={10} eyeTop={12} mouthType="smile" blush />
      </div>
      <div className="white-stem s50" />
      <div className="soil" />
    </div>
  );
}

/* ── 5일: 콩나물 ── */
function SproutKongi() {
  return (
    <div className="kongi sprout-kongi">
      <div className="sprout-head">
        <Face eyeGap={12} eyeTop={14} mouthType="smile" blush />
        <div className="leaf left" />
        <div className="leaf right" />
      </div>
      <div className="white-stem s65" />
      <div className="soil" />
    </div>
  );
}

/* ── 6일: 무성한 콩나물 ── */
function FullKongi() {
  return (
    <div className="kongi full-kongi">
      <div className="full-head">
        <Face eyeGap={14} eyeTop={16} mouthType="big-smile" blush />
        <div className="leaf left big" />
        <div className="leaf right big" />
      </div>
      <div className="white-stem s80" />
      <div className="soil" />
    </div>
  );
}

/* ── 7일: 수확 완료 ── */
function HarvestKongi() {
  return (
    <div className="kongi harvest-kongi">
      <div className="harvest-head">
        <div className="face">
          <div className="eye star left" style={{ left: 14, top: 16 }} />
          <div className="eye star right" style={{ right: 14, top: 16 }} />
          <div className="mouth excited" />
          <div className="blush left" /><div className="blush right" />
        </div>
        <div className="leaf left big" />
        <div className="leaf right big" />
        <div className="sparkle s1">✦</div>
        <div className="sparkle s2">✦</div>
        <div className="sparkle s3">✦</div>
      </div>
      <div className="white-stem s90" />
      <div className="soil" />
    </div>
  );
}

/* ── 죽음 ── */
function DeadKongi() {
  return (
    <div className="kongi dead-kongi">
      <div className="dead-head">
        <div className="face">
          <div className="eye x left" style={{ left: 14, top: 14 }} />
          <div className="eye x right" style={{ right: 14, top: 14 }} />
          <div className="mouth sad" />
        </div>
      </div>
      <div className="dead-stem" />
      <div className="soil dark" />
    </div>
  );
}
