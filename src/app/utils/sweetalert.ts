import SweetAlertLib, { SweetAlertResult } from "sweetalert2";

const Swal = {
  ...SweetAlertLib,
  fire: async (...args: Parameters<typeof SweetAlertLib.fire>): Promise<SweetAlertResult> => {
    const result = await SweetAlertLib.fire(...args);
    // Always return a proper SweetAlertResult object
    return result || { isConfirmed: false, isDismissed: true, isDenied: false };
  },
  showLoading: SweetAlertLib.showLoading,
  close: SweetAlertLib.close
};

export default Swal;