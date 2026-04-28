package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.model.Medicine;
import com.pharmadesk.backend.model.MedicineStock;
import com.pharmadesk.backend.pharmacy.repository.MedicineRepository;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
public class MedicineController {

    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository stockRepository;

    public MedicineController(MedicineRepository medicineRepository, MedicineStockRepository stockRepository) {
        this.medicineRepository = medicineRepository;
        this.stockRepository = stockRepository;
    }

    @GetMapping("/medicines")
    public ResponseEntity<ApiResponse<List<Medicine>>> getAllMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineRepository.findAll(), "Medicines fetched successfully"));
    }

    @PostMapping("/medicines")
    public ResponseEntity<ApiResponse<Medicine>> createMedicine(@RequestBody Medicine medicine) {
        Medicine saved = medicineRepository.save(medicine);
        return ResponseEntity.ok(ApiResponse.success(saved, "Medicine added successfully"));
    }

    @PutMapping("/medicines/{id}")
    public ResponseEntity<ApiResponse<Medicine>> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicineData) {
        return medicineRepository.findById(id).map(medicine -> {
            medicine.setName(medicineData.getName());
            medicine.setGenericName(medicineData.getGenericName());
            medicine.setManufacturer(medicineData.getManufacturer());
            medicine.setCategory(medicineData.getCategory());
            medicine.setUnit(medicineData.getUnit());
            medicine.setHsnCode(medicineData.getHsnCode());
            medicine.setGstPercent(medicineData.getGstPercent());
            medicine.setTaxPercentage(medicineData.getTaxPercentage());
            medicine.setReorderLevel(medicineData.getReorderLevel());
            medicine.setCount(medicineData.getCount());
            Medicine updated = medicineRepository.save(medicine);
            return ResponseEntity.ok(ApiResponse.success(updated, "Medicine updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/medicines/search")
    public ResponseEntity<List<Medicine>> searchMedicines(@RequestParam String name) {
        return ResponseEntity.ok(medicineRepository.findByNameContainingIgnoreCase(name));
    }

    @GetMapping("/stocks/search")
    public ResponseEntity<List<MedicineStock>> searchStocks(@RequestParam String name) {
        return ResponseEntity.ok(stockRepository.findByMedicineNameContainingIgnoreCase(name));
    }

    @GetMapping("/stocks")
    public ResponseEntity<ApiResponse<List<MedicineStock>>> getAllStocks() {
        return ResponseEntity.ok(ApiResponse.success(stockRepository.findAll(), "Stocks fetched successfully"));
    }
}
