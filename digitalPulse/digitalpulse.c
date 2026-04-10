#include "xs.h"
#include "xsmc.h"
// #include "driver/gpio.h"

// // Let op: afhankelijk van je platform heb je een delay-functie nodig.
// Voor ESP32 is dit vaak 'ets_delay_us' of 'usleep'.
#if ESP32
#include "rom/ets_sys.h"
#define udelay(us) ets_delay_us(us)
#else
#define udelay(us) // Voeg hier je platform-specifieke micro-delay toe
#endif

void xs_digitalPulse(xsMachine *the) {
  xsmcGet(xsResult, xsArg(1), xsID("length"));
  int length = xsmcToInteger(xsResult);

  if (xsmcArgc < 2) {
    xsUnknownError("Expected: (pinObject, pulsesArray)");
    return;
  }

  if (!xsmcHas(xsArg(0), xsID("write"))) {
    xsUnknownError("Object has no 'write' method. Is it a Digital pin?");
    return;
  }

  xsTry {
    xsmcVars(1);
    for (int i = 0; i < length; i++) {
      xsmcGetIndex(xsResult, xsArg(1), (xsUnsignedValue)i);
      long delta = xsmcToInteger(xsResult);
      int level = (delta > 0) ? 1 : 0;
      unsigned long us =
          (delta > 0) ? (unsigned long)delta : (unsigned long)(-delta);
      xsmcSetInteger(xsVar(0),
                     level); // Gebruik een tijdelijke variabele voor de aanroep
      xsmcCall(xsResult, xsArg(0), xsID("write"), &(xsVar(0)), NULL);
      if (us > 0) {
        udelay(us);
      }
    }
  }
  xsCatch {
    xsLog("\nError Digital.write: %s", xsmcToString(xsException));
    xsLog("\n");
  }
}
